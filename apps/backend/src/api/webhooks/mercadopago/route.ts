import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { Modules, PaymentWebhookEvents, PaymentSessionStatus } from '@medusajs/framework/utils'
import MercadoPagoConfig, {
  InvalidWebhookSignatureError,
  Payment,
  WebhookSignatureValidator,
} from 'mercadopago'
import { env } from '../../../env'

// The payment module prefixes this value with `pp_` when resolving the provider,
// so it must be `<identifier>_<id>` without the `pp_` prefix.
const PROVIDER_ID = 'mercado-pago_mercado-pago'
const SIGNATURE_TOLERANCE_SECONDS = 300

type MpWebhookBody = {
  id?: string | number
  type?: string
  topic?: string
  action?: string
  data?: { id?: string | number }
  resource?: string | number
}

function readHeader(req: MedusaRequest, name: string): string | undefined {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

function readQuery(req: MedusaRequest, name: string): string | undefined {
  const value = (req.query as Record<string, unknown> | undefined)?.[name]
  if (Array.isArray(value)) {
    return value[0] !== undefined ? String(value[0]) : undefined
  }
  return value !== undefined && value !== null ? String(value) : undefined
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as MpWebhookBody
  const type = body.type ?? body.topic

  // Only payment notifications require processing. Merchant-order / QR events are acknowledged.
  if (type && type !== 'payment') {
    return res.status(200).json({ received: true, ignored: true })
  }

  const dataId =
    readQuery(req, 'data.id') ??
    readQuery(req, 'id') ??
    (body.data?.id !== undefined ? String(body.data.id) : undefined)

  if (!dataId) {
    return res.status(200).json({ received: true, ignored: true })
  }

  const webhookSecret = env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[MercadoPago] MERCADO_PAGO_WEBHOOK_SECRET is not configured; rejecting webhook')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: readHeader(req, 'x-signature'),
      xRequestId: readHeader(req, 'x-request-id'),
      dataId,
      secret: webhookSecret,
      toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
    })
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.warn(
        `[MercadoPago] Invalid webhook signature (${error.reason}) requestId=${error.requestId ?? 'n/a'}`,
      )
      return res.status(401).json({ error: 'Invalid signature' })
    }
    throw error
  }

  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    console.error('[MercadoPago] MERCADO_PAGO_ACCESS_TOKEN is not configured')
    return res.status(500).json({ error: 'Payment provider not configured' })
  }

  let payment: Awaited<ReturnType<Payment['get']>>
  try {
    payment = await new Payment(
      new MercadoPagoConfig({ accessToken, options: { timeout: 15_000 } }),
    ).get({ id: dataId })
  } catch (error) {
    // Returning 5xx makes Mercado Pago retry the notification.
    console.error('[MercadoPago] Could not retrieve payment from Mercado Pago', error)
    return res.status(502).json({ error: 'Payment lookup failed' })
  }

  const sessionId = payment.external_reference
  if (!sessionId) {
    console.warn(`[MercadoPago] Payment ${dataId} has no external_reference; ignoring`)
    return res.status(200).json({ received: true, ignored: true })
  }

  // Pending / rejected payments must not reach Medusa's processPaymentWorkflow:
  // it completes the cart for any event carrying data.
  if (payment.status !== 'approved' && payment.status !== 'authorized') {
    return res.status(200).json({ received: true, status: payment.status })
  }

  const paymentModule = req.scope.resolve(Modules.PAYMENT) as any

  try {
    const session = await paymentModule.retrievePaymentSession(sessionId, {
      relations: ['payment'],
    })
    const paymentRecord = session?.payment

    if (
      session?.status === PaymentSessionStatus.CAPTURED ||
      paymentRecord?.captured_at
    ) {
      return res.status(200).json({ received: true, duplicate: true })
    }
  } catch (error) {
    // Unknown session id: acknowledge so Mercado Pago does not retry forever.
    console.warn(
      `[MercadoPago] Payment ${dataId} references unknown payment session ${sessionId}`,
    )
    return res.status(200).json({ received: true, ignored: true })
  }

  const eventBus = req.scope.resolve(Modules.EVENT_BUS) as any

  try {
    await eventBus.emit(
      {
        name: PaymentWebhookEvents.WebhookReceived,
        data: {
          provider: PROVIDER_ID,
          payload: {
            data: body,
            rawData: req.rawBody ?? JSON.stringify(body),
            headers: req.headers,
          },
        },
      },
      { delay: 2_000, attempts: 3 },
    )
  } catch (error) {
    console.error('[MercadoPago] Failed to enqueue webhook event', error)
    return res.status(500).json({ error: 'Webhook enqueue failed' })
  }

  return res.status(200).json({ received: true })
}
