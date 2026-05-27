import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

type OrderService = {
  updateOrder(id: string, data: Record<string, unknown>): Promise<void>
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { order_id, sii_status, boleta_url } = req.body as {
    order_id: string
    sii_status: string
    boleta_url?: string
  }

  if (sii_status === 'exitoso' && boleta_url) {
    const orderService = req.scope.resolve('orderService') as OrderService
    try {
      await orderService.updateOrder(order_id, {
        metadata: {
          sii_boleta_url: boleta_url,
          sii_status: 'emitida',
          sii_emitted_at: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('[Sonom] Failed to update order with SII data:', error)
    }
  }

  return res.status(200).json({ received: true })
}
