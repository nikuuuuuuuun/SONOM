import { setTimeout as delay } from 'node:timers/promises'
import { env } from '../../env'

export type SiiOrderItem = {
  id?: string | null
  product_id?: string | null
  variant_id?: string | null
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity: number
  unit_price: unknown
  total?: unknown
  discount_total?: unknown
}

export type SiiOrderAddress = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
} | null

export type SiiOrderCustomer = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  metadata?: Record<string, unknown> | null
} | null

export type SiiOrder = {
  id: string
  display_id?: string | number | null
  email?: string | null
  currency_code?: string | null
  total?: unknown
  item_total?: unknown
  shipping_total?: unknown
  tax_total?: unknown
  created_at?: string | Date | null
  metadata?: Record<string, unknown> | null
  items?: SiiOrderItem[] | null
  shipping_address?: SiiOrderAddress
  billing_address?: SiiOrderAddress
  customer?: SiiOrderCustomer
}

export type SiiBoletaStatus = 'emitida' | 'pendiente' | 'fallido'

export type SiiBoletaResult = {
  status: SiiBoletaStatus
  folio?: string
  boletaUrl?: string
  providerStatus?: string
  raw: unknown
}

export class SiiInvoicingError extends Error {
  readonly retryable: boolean
  readonly statusCode?: number

  constructor(
    message: string,
    options: { retryable?: boolean; statusCode?: number } = {},
  ) {
    super(message)
    this.name = 'SiiInvoicingError'
    this.retryable = options.retryable ?? false
    this.statusCode = options.statusCode
  }
}

type SiiLine = {
  codigo: string
  nombre: string
  cantidad: number
  precio_unitario: number
  monto: number
  neto: number
  iva: number
  exento: boolean
}

type SiiPayload = {
  tipo_dte: number
  emisor: {
    rut: string
    razon_social: string
    giro: string
    actividad_economica?: string | number
    direccion: string
    comuna: string
    ciudad: string
    telefono?: string
    email?: string
  }
  receptor: {
    rut: string
    razon_social: string
    giro: string
    direccion: string
    comuna: string
    ciudad: string
    email?: string
  }
  items: SiiLine[]
  totales: {
    neto: number
    iva: number
    total: number
    moneda: 'CLP'
  }
  forma_pago: 'CONTADO'
  fecha_emision: string
  referencia: string
  observaciones: string
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }
  return undefined
}

function normalizeRut(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value.replace(/\./g, '').replace(/\s+/g, '').toUpperCase()
}

function numberFrom(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Native SII boleta issuer.
 *
 * The payload below is provider-agnostic: it maps Medusa order data to the
 * common Chilean DTE shape used by Haulmer, SimpleBoleta, OpenFactura, etc.
 * If your provider expects different field names (for example `precio` instead
 * of `precio_unitario`, or `detalle` instead of `items`), adjust `buildPayload`
 * only. The HTTP/auth/idempotency handling stays the same.
 *
 * Idempotency: the Medusa order id is sent in `SII_IDEMPOTENCY_HEADER`. If the
 * provider supports idempotency keys, retries will not duplicate the boleta.
 */
class SiiInvoicingService {
  isConfigured(): boolean {
    if (env.SII_ENABLED === 'false') return false

    return Boolean(
      env.SII_API_URL &&
        env.SII_API_KEY &&
        env.SII_EMISOR_RUT &&
        env.SII_EMISOR_RAZON_SOCIAL,
    )
  }

  async emitBoleta(order: SiiOrder): Promise<SiiBoletaResult> {
    if (order.currency_code && order.currency_code.toLowerCase() !== 'clp') {
      throw new SiiInvoicingError(
        `[SII] Only CLP orders can be invoiced (received ${order.currency_code})`,
        { retryable: false },
      )
    }

    const payload = this.buildPayload(order)
    const maxAttempts = Math.min(
      5,
      Math.max(1, Math.trunc(numberFrom(env.SII_API_MAX_ATTEMPTS, 3))),
    )

    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.post(payload, order.id)
      } catch (error) {
        lastError = error

        const retryable =
          error instanceof SiiInvoicingError ? error.retryable : true

        if (!retryable || attempt === maxAttempts) {
          break
        }

        // Exponential backoff: 500 ms, 1 s, 2 s, 4 s…
        await delay(500 * 2 ** (attempt - 1))
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new SiiInvoicingError('[SII] Unknown invoicing error', {
          retryable: false,
        })
  }

  private buildPayload(order: SiiOrder): SiiPayload {
    const ivaRate = Math.min(
      1,
      Math.max(0, numberFrom(env.SII_IVA_RATE, 0.19)),
    )
    const pricesIncludeTax = env.SII_PRICES_INCLUDE_TAX !== 'false'
    const address = order.billing_address ?? order.shipping_address ?? null
    const customer = order.customer ?? null
    const orderMetadata = (order.metadata ?? {}) as Record<string, unknown>
    const customerMetadata = (customer?.metadata ?? {}) as Record<string, unknown>

    const receiverName =
      [customer?.first_name, customer?.last_name]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(' ')
        .trim() ||
      order.email ||
      'Consumidor Final'

    const receiverRut =
      normalizeRut(
        firstString(
          orderMetadata.customer_rut,
          customerMetadata.rut,
          env.SII_CONSUMIDOR_FINAL_RUT,
        ),
      ) ?? '66666666-6'

    const items = (order.items ?? []).map((item, index) => {
      const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1))
      const unitPrice = Number(item.unit_price) || 0
      const lineTotal = Number(item.total)

      return this.buildLine({
        code: firstString(item.variant_id, item.product_id, item.id) ?? `ITEM-${index + 1}`,
        name:
          firstString(item.product_title, item.title, item.variant_title) ??
          `Producto ${index + 1}`,
        quantity,
        unitPrice,
        lineTotal: Number.isFinite(lineTotal) ? lineTotal : undefined,
        pricesIncludeTax,
        ivaRate,
      })
    })

    const shipping = Number(order.shipping_total) || 0
    if (shipping > 0) {
      items.push(
        this.buildLine({
          code: 'ENVIO',
          name: 'Envío',
          quantity: 1,
          unitPrice: shipping,
          pricesIncludeTax,
          ivaRate,
        }),
      )
    }

    const total = items.reduce((sum, item) => sum + item.monto, 0)
    const neto = items.reduce((sum, item) => sum + item.neto, 0)
    const iva = total - neto

    return {
      tipo_dte: Math.trunc(numberFrom(env.SII_DTE_TYPE, 39)),
      emisor: {
        rut: normalizeRut(env.SII_EMISOR_RUT) ?? '',
        razon_social: env.SII_EMISOR_RAZON_SOCIAL ?? '',
        giro: env.SII_EMISOR_GIRO ?? 'Comercio al por menor',
        actividad_economica: env.SII_EMISOR_ACTIVIDAD_ECONOMICA,
        direccion: env.SII_EMISOR_DIRECCION ?? 'Sin dirección',
        comuna: env.SII_EMISOR_COMUNA ?? 'Sin comuna',
        ciudad: env.SII_EMISOR_CIUDAD ?? 'Sin ciudad',
        telefono: env.SII_EMISOR_TELEFONO,
        email: env.SII_EMISOR_EMAIL,
      },
      receptor: {
        rut: receiverRut,
        razon_social: receiverName,
        giro: address?.company ? 'Empresa' : 'Particular',
        direccion: address?.address_1 ?? 'Sin dirección',
        comuna: address?.city ?? address?.province ?? 'Sin comuna',
        ciudad: address?.city ?? 'Sin ciudad',
        email: order.email ?? customer?.email ?? undefined,
      },
      items,
      totales: {
        neto,
        iva,
        total,
        moneda: 'CLP',
      },
      forma_pago: 'CONTADO',
      fecha_emision: this.issueDate(order.created_at),
      referencia: order.id,
      observaciones: `Pedido #${order.display_id ?? order.id}`,
    }
  }

  private buildLine(input: {
    code: string
    name: string
    quantity: number
    unitPrice: number
    lineTotal?: number
    pricesIncludeTax: boolean
    ivaRate: number
  }): SiiLine {
    const gross = Number.isFinite(input.lineTotal)
      ? Math.round(input.lineTotal as number)
      : Math.round(
          (input.pricesIncludeTax
            ? input.unitPrice
            : input.unitPrice * (1 + input.ivaRate)) * input.quantity,
        )
    const grossUnit = Math.round(gross / input.quantity)
    const neto = Math.round(gross / (1 + input.ivaRate))

    return {
      codigo: input.code,
      nombre: input.name.slice(0, 120),
      cantidad: input.quantity,
      // Most Chilean providers expect the gross unit price for boletas.
      // If yours expects the net price, use `neto / cantidad` here.
      precio_unitario: grossUnit,
      monto: gross,
      neto,
      iva: gross - neto,
      exento: false,
    }
  }

  private issueDate(createdAt: string | Date | null | undefined): string {
    const date = createdAt ? new Date(createdAt) : new Date()
    // en-CA renders YYYY-MM-DD and America/Santiago handles the SII day boundary.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  private async post(
    payload: SiiPayload,
    orderId: string,
  ): Promise<SiiBoletaResult> {
    const apiUrl = env.SII_API_URL
    const apiKey = env.SII_API_KEY

    if (!apiUrl || !apiKey) {
      throw new SiiInvoicingError(
        '[SII] SII_API_URL and SII_API_KEY are required to issue a boleta',
        { retryable: false },
      )
    }

    const timeoutMs = Math.max(
      1_000,
      Math.trunc(numberFrom(env.SII_API_TIMEOUT_MS, 15_000)),
    )
    const keyHeader = env.SII_API_KEY_HEADER || 'Authorization'
    const keyPrefix =
      env.SII_API_KEY_PREFIX ??
      (keyHeader.toLowerCase() === 'authorization' ? 'Bearer' : '')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'user-agent': 'SONOM-Medusa/1.0',
          [keyHeader]: keyPrefix ? `${keyPrefix} ${apiKey}` : apiKey,
          [env.SII_IDEMPOTENCY_HEADER || 'Idempotency-Key']: orderId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const text = await response.text()
      let json: unknown

      try {
        json = text ? JSON.parse(text) : undefined
      } catch {
        json = undefined
      }

      if (!response.ok) {
        const retryable =
          response.status >= 500 ||
          response.status === 408 ||
          response.status === 429

        throw new SiiInvoicingError(
          `[SII] HTTP ${response.status}: ${
            text.slice(0, 500) || response.statusText
          }`,
          { retryable, statusCode: response.status },
        )
      }

      return this.normalizeResponse(json ?? text, orderId)
    } catch (error) {
      if (error instanceof SiiInvoicingError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new SiiInvoicingError(
          `[SII] Request timed out after ${timeoutMs} ms`,
          { retryable: true },
        )
      }

      throw new SiiInvoicingError(
        `[SII] Network error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { retryable: true },
      )
    } finally {
      clearTimeout(timer)
    }
  }

  private normalizeResponse(
    raw: unknown,
    orderId: string,
  ): SiiBoletaResult {
    const root = asRecord(raw)
    const data = asRecord(root?.data) ?? root ?? {}
    const folio = firstString(
      data.folio,
      data.numero,
      data.number,
      data.id,
      root?.folio,
    )
    let boletaUrl = firstString(
      data.boleta_url,
      data.boletaUrl,
      data.pdf_url,
      data.pdfUrl,
      data.url,
      data.link,
      data.documento_url,
      root?.boleta_url,
    )
    const providerStatus = firstString(
      data.sii_status,
      data.estado,
      data.status,
      root?.status,
      root?.sii_status,
    )
    const normalizedStatus = (providerStatus ?? '').toLowerCase()

    if (!boletaUrl && folio && env.SII_BOLETA_URL_TEMPLATE) {
      boletaUrl = env.SII_BOLETA_URL_TEMPLATE.replace('{folio}', folio).replace(
        '{id}',
        orderId,
      )
    }

    const failed = [
      'fallido',
      'rechazado',
      'error',
      'rejected',
      'failed',
    ].includes(normalizedStatus)
    const succeeded =
      Boolean(boletaUrl) ||
      [
        'emitida',
        'aceptada',
        'ok',
        'success',
        'completed',
        'issued',
        'accepted',
      ].includes(normalizedStatus)

    const status: SiiBoletaStatus = failed
      ? 'fallido'
      : succeeded
        ? 'emitida'
        : 'pendiente'

    return {
      status,
      folio,
      boletaUrl,
      providerStatus,
      raw,
    }
  }
}

export default SiiInvoicingService
