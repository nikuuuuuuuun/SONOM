import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { IOrderModuleService, OrderDTO } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService = container.resolve(Modules.ORDER) as IOrderModuleService

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ['items', 'shipping_address', 'customer'],
  })

  const n8nWebhookUrl = process.env.N8N_ORDER_WEBHOOK_URL
  if (!n8nWebhookUrl) {
    console.warn('[Sonom] N8N_ORDER_WEBHOOK_URL not configured.')
    return
  }

  const payload = {
    event: 'order.placed',
    order_id: order.id,
    display_id: (order as OrderDTO).display_id,
    email: order.email,
    customer: {
      first_name: (order as any).customer?.first_name,
      last_name: (order as any).customer?.last_name,
      email: order.email,
    },
    shipping_address: {
      address_1: (order as any).shipping_address?.address_1,
      city: (order as any).shipping_address?.city,
      province: (order as any).shipping_address?.province,
      postal_code: (order as any).shipping_address?.postal_code,
      country_code: (order as any).shipping_address?.country_code,
    },
    items: (order as any).items?.map((item: any) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    total: order.total,
    currency_code: order.currency_code,
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      console.error(`[Sonom] n8n webhook error: ${response.status}`)
    } else {
      console.log(`[Sonom] Order #${(order as OrderDTO).display_id} sent to n8n`)
    }
  } catch (error) {
    console.error('[Sonom] n8n webhook error:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
  context: { subscriberId: 'sonom-order-placed-n8n' },
}
