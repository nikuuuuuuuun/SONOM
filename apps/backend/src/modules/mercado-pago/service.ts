import { AbstractPaymentProvider } from '@medusajs/framework/utils'
import MercadoPagoConfig, { Preference } from 'mercadopago'

type Options = { accessToken: string }

class MercadoPagoProvider extends AbstractPaymentProvider<Options> {
  static identifier = 'mercado-pago'
  protected client: MercadoPagoConfig

  constructor(container: any, options: Options) {
    super(container, options)
    this.client = new MercadoPagoConfig({ accessToken: options.accessToken })
  }

  async initiatePayment(input: any) {
    const pref = new Preference(this.client)
    const result = await pref.create({
      body: {
        items: [{ id: input.context?.cart?.id || 'order', title: input.context?.cart?.id || 'Order', quantity: 1, unit_price: input.amount }],
        back_urls: { success: process.env.STORE_CORS || 'http://localhost:8000' },
        auto_return: 'approved',
      },
    })
    const id = result.id || ''
    return { id, data: { preference_id: id, init_point: result.init_point } }
  }

  async authorizePayment(paymentSession: any): Promise<any> { return { status: 'authorized', data: paymentSession.data } }
  async capturePayment(paymentSession: any): Promise<any> { return { status: 'captured', data: paymentSession.data } }
  async refundPayment(paymentSession: any): Promise<any> { return { status: 'refunded', data: paymentSession.data } }
  async cancelPayment(paymentSession: any): Promise<any> { return { status: 'canceled', data: paymentSession.data } }
  async deletePayment(): Promise<any> { return }
  async getPaymentStatus(paymentSession: any): Promise<any> { return paymentSession.status || 'pending' }
  async retrievePayment(paymentSession: any): Promise<any> { return paymentSession }
  async updatePayment(input: any): Promise<any> { return this.initiatePayment(input) }
  async getWebhookActionAndData(): Promise<any> { return { action: 'not_supported' } }
}

export default MercadoPagoProvider