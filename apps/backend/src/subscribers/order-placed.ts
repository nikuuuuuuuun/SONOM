import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import type { IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { env } from '../env'
import { SII_INVOICING_MODULE } from '../modules/sii-invoicing'
import SiiInvoicingService, {
  SiiInvoicingError,
  type SiiOrder,
} from '../modules/sii-invoicing/service'

function metadataOf(order: { metadata?: unknown }): Record<string, unknown> {
  return (order.metadata ?? {}) as Record<string, unknown>
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Emits the Chilean electronic boleta (DTE 39) natively after an order is placed.
 *
 * Replaces the old n8n workflow:
 *   order.placed -> Medusa subscriber -> SII provider REST API -> order.metadata
 *
 * Idempotency is enforced twice:
 *   1. If `sii_status === "emitida"` the subscriber exits early.
 *   2. The provider request carries the Medusa order id as `Idempotency-Key`.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService = container.resolve<IOrderModuleService>(
    Modules.ORDER,
  )
  const siiInvoicing = container.resolve<SiiInvoicingService>(
    SII_INVOICING_MODULE,
  )

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ['items', 'shipping_address', 'billing_address', 'customer'],
  })

  const currentMetadata = metadataOf(order)

  // A boleta is immutable once issued; never emit a second one for the same order.
  if (currentMetadata.sii_status === 'emitida') {
    return
  }

  if (env.SII_ENABLED === 'false') {
    return
  }

  if (!siiInvoicing.isConfigured()) {
    console.warn(
      '[Sonom/SII] SII_API_URL, SII_API_KEY or emisor data is missing; skipping boleta emission.',
    )

    await orderModuleService.updateOrders(order.id, {
      metadata: {
        ...currentMetadata,
        sii_status: 'no_configurado',
        sii_updated_at: new Date().toISOString(),
      },
    })

    return
  }

  const attempts = Number(currentMetadata.sii_attempts ?? 0) + 1
  const orderInput = toSiiOrder(order)

  try {
    const result = await siiInvoicing.emitBoleta(orderInput)
    const now = new Date().toISOString()

    const nextMetadata: Record<string, unknown> = {
      ...currentMetadata,
      sii_status: result.status,
      sii_attempts: attempts,
      sii_updated_at: now,
      sii_provider_status: result.providerStatus ?? null,
      sii_error: null,
    }

    if (result.folio) {
      nextMetadata.sii_folio = result.folio
    }
    if (result.boletaUrl) {
      nextMetadata.sii_boleta_url = result.boletaUrl
    }
    if (result.status === 'emitida') {
      nextMetadata.sii_emitted_at = now
    }

    await orderModuleService.updateOrders(order.id, {
      metadata: nextMetadata,
    })

    console.log(
      `[Sonom/SII] Order #${order.display_id ?? order.id}: boleta ${result.status}` +
        (result.folio ? ` folio=${result.folio}` : ''),
    )
  } catch (error) {
    const now = new Date().toISOString()
    const message = errorMessage(error).slice(0, 2_000)

    console.error('[Sonom/SII] Boleta emission failed', error)

    await orderModuleService.updateOrders(order.id, {
      metadata: {
        ...currentMetadata,
        sii_status: 'fallido',
        sii_error: message,
        sii_attempts: attempts,
        sii_updated_at: now,
      },
    })

    // Let Medusa's event bus retry transient failures (5xx, timeouts, network).
    // 4xx errors are configuration/data problems: retrying will not help.
    if (error instanceof SiiInvoicingError && error.retryable) {
      throw error
    }
  }
}

function toSiiOrder(
  order: Awaited<ReturnType<IOrderModuleService['retrieveOrder']>>,
): SiiOrder {
  const customer = (order as { customer?: Record<string, unknown> | null })
    .customer

  return {
    id: order.id,
    display_id: order.display_id,
    email: order.email,
    currency_code: order.currency_code,
    total: order.total,
    item_total: order.item_total,
    shipping_total: order.shipping_total,
    tax_total: order.tax_total,
    created_at: order.created_at,
    metadata: metadataOf(order),
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      title: item.title,
      product_title: item.product_title,
      variant_title: item.variant_title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      discount_total: item.discount_total,
    })),
    shipping_address: order.shipping_address
      ? {
          first_name: order.shipping_address.first_name,
          last_name: order.shipping_address.last_name,
          company: order.shipping_address.company,
          address_1: order.shipping_address.address_1,
          address_2: order.shipping_address.address_2,
          city: order.shipping_address.city,
          province: order.shipping_address.province,
          postal_code: order.shipping_address.postal_code,
          country_code: order.shipping_address.country_code,
          phone: order.shipping_address.phone,
        }
      : null,
    billing_address: order.billing_address
      ? {
          first_name: order.billing_address.first_name,
          last_name: order.billing_address.last_name,
          company: order.billing_address.company,
          address_1: order.billing_address.address_1,
          address_2: order.billing_address.address_2,
          city: order.billing_address.city,
          province: order.billing_address.province,
          postal_code: order.billing_address.postal_code,
          country_code: order.billing_address.country_code,
          phone: order.billing_address.phone,
        }
      : null,
    customer: customer
      ? {
          first_name: customer.first_name as string | null | undefined,
          last_name: customer.last_name as string | null | undefined,
          email: customer.email as string | null | undefined,
          metadata: (customer.metadata ?? null) as Record<
            string,
            unknown
          > | null,
        }
      : null,
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
  context: { subscriberId: 'sonom-order-placed-sii' },
}
