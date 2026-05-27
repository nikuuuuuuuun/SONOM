import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

type Order = {
  id: string
  display_id: number
  email: string
  total: number
  currency_code: string
  customer?: { first_name?: string; last_name?: string }
  shipping_address?: {
    address_1?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
  }
  items?: Array<{ title: string; quantity: number; unit_price: number }>
}

type OrderService = {
  retrieveOrder(id: string, config: { relations: string[] }): Promise<Order>
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve('orderService') as OrderService
  const order = await orderService.retrieveOrder(data.id, {
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
    display_id: order.display_id,
    email: order.email,
    customer: {
      first_name: order.customer?.first_name,
      last_name: order.customer?.last_name,
      email: order.email,
    },
    shipping_address: {
      address_1: order.shipping_address?.address_1,
      city: order.shipping_address?.city,
      province: order.shipping_address?.province,
      postal_code: order.shipping_address?.postal_code,
      country_code: order.shipping_address?.country_code,
    },
    items: order.items?.map((item: any) => ({
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
      console.log(`[Sonom] Order #${order.display_id} sent to n8n`)
    }
  } catch (error) {
    console.error('[Sonom] n8n webhook error:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
  context: { subscriberId: 'sonom-order-placed-n8n' },
}
