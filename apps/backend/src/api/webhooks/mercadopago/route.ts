import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as {
    action: string
    data: { id: string }
    type: string
  }

  if (body.type === 'payment' && body.action === 'payment.created') {
    const paymentId = body.data.id
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      return res.status(500).json({ error: 'MERCADO_PAGO_ACCESS_TOKEN not configured' })
    }

    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payment = await mpRes.json()

      if (payment.status === 'approved' && payment.external_reference) {
        const orderModuleService = req.scope.resolve(Modules.ORDER) as IOrderModuleService
        await orderModuleService.updateOrders(payment.external_reference, {
          metadata: { payment_id: paymentId, payment_status: 'captured' },
        })
      }
    } catch (error) {
      console.error('[MercadoPago] Webhook error:', error)
      return res.status(500).json({ error: 'Webhook processing failed' })
    }
  }

  return res.status(200).json({ received: true })
}
