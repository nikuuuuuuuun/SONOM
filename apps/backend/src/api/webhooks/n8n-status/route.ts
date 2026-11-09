import { createHmac, timingSafeEqual } from 'crypto'
import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import type { IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { z } from 'zod'
import { env } from '../../../env'

const REPLAY_WINDOW_SECONDS = 300

const bodySchema = z
  .object({
    order_id: z.string().min(1),
    sii_status: z.enum(['exitoso', 'fallido', 'pendiente']),
    boleta_url: z.string().url().optional(),
    error: z.string().max(2_000).optional(),
  })
  .strict()

function readHeader(req: MedusaRequest, name: string): string | undefined {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

function safeEqual(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const providedBuffer = Buffer.from(provided, 'utf8')

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = env.N8N_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Sonom/SII] N8N_WEBHOOK_SECRET is not configured; rejecting callback')
    return res.status(500).json({ error: 'Callback secret not configured' })
  }

  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      issues: parsed.error.issues.map((issue) => issue.message),
    })
  }

  const { order_id, sii_status, boleta_url, error: siiError } = parsed.data
  const timestamp = readHeader(req, 'x-sonom-timestamp')
  const signature = readHeader(req, 'x-sonom-signature')

  if (!timestamp || !signature) {
    return res.status(401).json({ error: 'Missing signature headers' })
  }

  const timestampSeconds = Number(timestamp)
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > REPLAY_WINDOW_SECONDS
  ) {
    return res.status(401).json({ error: 'Stale or invalid timestamp' })
  }

  const manifest = `${timestamp}.${order_id}.${sii_status}.${boleta_url ?? ''}`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  if (!safeEqual(expected, signature)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  if (sii_status === 'exitoso' && !boleta_url) {
    return res.status(400).json({ error: 'boleta_url is required when sii_status is exitoso' })
  }

  const orderModuleService = req.scope.resolve(Modules.ORDER) as IOrderModuleService

  let order: Awaited<ReturnType<IOrderModuleService['retrieveOrder']>>
  try {
    order = await orderModuleService.retrieveOrder(order_id, {
      select: ['id', 'metadata'],
    })
  } catch {
    return res.status(404).json({ error: 'Order not found' })
  }

  const currentMetadata = ((order.metadata ?? {}) as Record<string, unknown>) || {}
  const emitted = sii_status === 'exitoso' && boleta_url
  const alreadyEmitted =
    currentMetadata.sii_status === 'emitida' &&
    currentMetadata.sii_boleta_url === boleta_url

  if (alreadyEmitted) {
    return res.status(200).json({ received: true, duplicate: true })
  }

  const metadata: Record<string, unknown> = {
    ...currentMetadata,
    sii_status: emitted ? 'emitida' : sii_status,
    sii_updated_at: new Date().toISOString(),
  }

  if (emitted) {
    metadata.sii_boleta_url = boleta_url
    metadata.sii_emitted_at = new Date().toISOString()
  }

  if (siiError) {
    metadata.sii_error = siiError
  }

  try {
    await orderModuleService.updateOrders(order_id, { metadata })
  } catch (error) {
    console.error('[Sonom/SII] Failed to update order metadata', error)
    return res.status(500).json({ error: 'Failed to update order' })
  }

  return res.status(200).json({ received: true })
}
