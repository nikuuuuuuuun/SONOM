import {
  AbstractPaymentProvider,
  BigNumber,
  PaymentActions,
  PaymentSessionStatus,
} from '@medusajs/framework/utils'
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from '@medusajs/framework/types'
import MercadoPagoConfig, {
  Payment,
  PaymentRefund,
  Preference,
} from 'mercadopago'

type Options = {
  accessToken: string
  webhookSecret?: string
  notificationUrl?: string
  backUrl?: string
  statementDescriptor?: string
}

type PaymentData = Record<string, unknown> & {
  session_id?: string
  cart_id?: string
  mp_payment_id?: string | number
}

type IncomingItem = {
  id?: string
  title?: string
  description?: string
  thumbnail?: string
  quantity?: number
  unit_price?: number
}

type PreferenceItem = {
  id: string
  title: string
  description?: string
  picture_url?: string
  quantity: number
  currency_id: string
  unit_price: number
}

type MpPayment = Awaited<ReturnType<Payment['get']>>
type MpRefund = Awaited<ReturnType<PaymentRefund['create']>>
type MpPreference = Awaited<ReturnType<Preference['create']>>

class MercadoPagoProvider extends AbstractPaymentProvider<Options> {
  static identifier = 'mercado-pago'

  private readonly client: MercadoPagoConfig
  private readonly payments: Payment
  private readonly preferences: Preference
  private readonly refunds: PaymentRefund

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options)

    if (!options?.accessToken) {
      throw new Error('[mercado-pago] MERCADO_PAGO_ACCESS_TOKEN is required')
    }

    this.client = new MercadoPagoConfig({
      accessToken: options.accessToken,
      options: { timeout: 20_000 },
    })
    this.payments = new Payment(this.client)
    this.preferences = new Preference(this.client)
    this.refunds = new PaymentRefund(this.client)
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentOutput> {
    const data = this.dataFrom(input)
    const sessionId = this.sessionId(data, input.context?.idempotency_key)
    const amount = this.toNumber(input.amount)
    const currency = input.currency_code.toUpperCase()
    const items = this.buildItems(data, amount, currency, sessionId)

    const storefront = this.storefrontUrl()
    const preference: MpPreference = await this.preferences.create({
      body: {
        items,
        external_reference: sessionId,
        notification_url: this.config.notificationUrl,
        statement_descriptor: this.config.statementDescriptor,
        metadata: {
          session_id: sessionId,
          cart_id: data.cart_id ?? null,
        },
        back_urls: {
          success: `${storefront}/checkout/return?status=success`,
          pending: `${storefront}/checkout/return?status=pending`,
          failure: `${storefront}/checkout/return?status=failure`,
        },
        // Mercado Pago only accepts auto_return for public HTTPS back URLs.
        auto_return: storefront.startsWith('https://') ? 'approved' : undefined,
      },
      requestOptions: sessionId
        ? { idempotencyKey: `pref_${sessionId}` }
        : undefined,
    })

    const id = preference.id || sessionId || ''

    return {
      id,
      status: PaymentSessionStatus.PENDING,
      data: {
        ...data,
        session_id: sessionId,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        preference_currency: currency,
        preference_total: amount,
        preference_items: items,
      },
    }
  }

  async updatePayment(
    input: UpdatePaymentInput,
  ): Promise<UpdatePaymentOutput> {
    const result = await this.initiatePayment(input as InitiatePaymentInput)
    return { status: result.status, data: result.data }
  }

  async authorizePayment(
    input: AuthorizePaymentInput,
  ): Promise<AuthorizePaymentOutput> {
    const data = this.dataFrom(input)
    const payment = await this.safeFindPayment(data)

    if (!payment) {
      console.warn(
        `[mercado-pago] No payment found for session ${this.sessionId(data) ?? 'unknown'}`,
      )
      return { status: PaymentSessionStatus.PENDING, data }
    }

    const merged = this.paymentData(payment, data)

    switch (payment.status) {
      // Funds are approved and captured immediately by Checkout Pro.
      case 'approved':
      // Pre-authorized payment: Medusa will capture it in the next step.
      case 'authorized':
        return { status: PaymentSessionStatus.AUTHORIZED, data: merged }

      case 'pending':
      case 'in_process':
        return { status: PaymentSessionStatus.PENDING, data: merged }

      default:
        return { status: PaymentSessionStatus.ERROR, data: merged }
    }
  }

  async capturePayment(
    input: CapturePaymentInput,
  ): Promise<CapturePaymentOutput> {
    const data = this.dataFrom(input)
    const payment = await this.requirePayment(data)

    if (payment.status === 'approved' || payment.captured) {
      return { data: this.paymentData(payment, data) }
    }

    if (payment.status !== 'authorized') {
      throw new Error(
        `[mercado-pago] Cannot capture payment ${payment.id} with status ${payment.status}`,
      )
    }

    const captured = await this.payments.capture({
      id: this.paymentId(payment),
      transaction_amount: payment.transaction_amount,
      requestOptions: {
        idempotencyKey: input.context?.idempotency_key,
      },
    })

    return { data: this.paymentData(captured, data) }
  }

  async refundPayment(
    input: RefundPaymentInput,
  ): Promise<RefundPaymentOutput> {
    const data = this.dataFrom(input)
    const payment = await this.requirePayment(data)
    const amount = this.toNumber(input.amount)
    const total = payment.transaction_amount ?? 0
    const idempotencyKey = input.context?.idempotency_key

    const refund: MpRefund =
      amount > 0 && total > 0 && amount < total - 0.000001
        ? await this.refunds.create({
            payment_id: this.paymentId(payment),
            body: { amount },
            requestOptions: { idempotencyKey },
          })
        : await this.refunds.total({
            payment_id: this.paymentId(payment),
            requestOptions: { idempotencyKey },
          })

    return {
      data: {
        ...this.paymentData(payment, data),
        mp_refund_id: refund.id,
        mp_refund_status: refund.status,
        mp_refund_amount: refund.amount,
      },
    }
  }

  async cancelPayment(
    input: CancelPaymentInput,
  ): Promise<CancelPaymentOutput> {
    const data = this.dataFrom(input)
    const payment = await this.safeFindPayment(data)

    if (!payment) {
      return { data }
    }

    if (payment.status === 'approved' || payment.captured) {
      throw new Error(
        `[mercado-pago] Payment ${payment.id} is already captured; issue a refund instead`,
      )
    }

    const canceled = await this.payments.cancel({
      id: this.paymentId(payment),
      requestOptions: { idempotencyKey: input.context?.idempotency_key },
    })

    return { data: this.paymentData(canceled, data) }
  }

  async deletePayment(_input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return {}
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<GetPaymentStatusOutput> {
    const data = this.dataFrom(input)
    const payment = await this.safeFindPayment(data)

    if (!payment) {
      return { status: PaymentSessionStatus.PENDING, data }
    }

    return {
      status: this.sessionStatus(payment),
      data: this.paymentData(payment, data),
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput,
  ): Promise<RetrievePaymentOutput> {
    const data = this.dataFrom(input)
    const payment = await this.safeFindPayment(data)
    return { data: payment ? this.paymentData(payment, data) : data }
  }

  async getWebhookActionAndData(event: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    const body = (event?.data ?? {}) as Record<string, any>
    const type = body.type ?? body.topic

    if (type && type !== 'payment') {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const paymentId = body?.data?.id ?? body.id ?? body.resource
    if (!paymentId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    let payment: MpPayment
    try {
      payment = await this.payments.get({ id: String(paymentId) })
    } catch (error) {
      console.error('[mercado-pago] Webhook payment lookup failed', error)
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const sessionId = payment.external_reference
    if (!sessionId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const data = {
      session_id: sessionId,
      amount: payment.transaction_amount ?? 0,
    }

    switch (payment.status) {
      case 'approved':
        return { action: PaymentActions.SUCCESSFUL, data }

      case 'authorized':
        return { action: PaymentActions.AUTHORIZED, data }

      case 'rejected':
      case 'cancelled':
        return { action: PaymentActions.FAILED, data }

      case 'refunded':
      case 'charged_back':
        return { action: PaymentActions.CANCELED, data }

      default:
        // Important: returning PENDING with data makes Medusa's processPaymentWorkflow
        // complete the cart, creating an order before the money is approved.
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }

  private dataFrom(input: { data?: Record<string, unknown> }): PaymentData {
    return (input.data ?? {}) as PaymentData
  }

  private sessionId(
    data: PaymentData,
    fallback?: string,
  ): string | undefined {
    const value = data.session_id ?? fallback
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }

  private async findPayment(data: PaymentData): Promise<MpPayment | null> {
    if (data.mp_payment_id !== undefined && data.mp_payment_id !== null) {
      return this.payments.get({ id: String(data.mp_payment_id) })
    }

    const reference = this.sessionId(data)
    if (!reference) {
      return null
    }

    const result = await this.payments.search({
      options: {
        external_reference: reference,
        sort: 'date_created',
        criteria: 'desc',
        limit: 10,
      },
    })

    const payments = result.results ?? []
    const preferred =
      payments.find((payment) => payment.status === 'approved') ??
      payments.find((payment) => payment.status === 'authorized') ??
      payments.find(
        (payment) =>
          payment.status === 'pending' || payment.status === 'in_process',
      ) ??
      payments[0]

    if (!preferred?.id) {
      return null
    }

    return this.payments.get({ id: String(preferred.id) })
  }

  private async safeFindPayment(data: PaymentData): Promise<MpPayment | null> {
    try {
      return await this.findPayment(data)
    } catch (error) {
      console.error('[mercado-pago] Payment lookup failed', error)
      return null
    }
  }

  private async requirePayment(data: PaymentData): Promise<MpPayment> {
    const payment = await this.findPayment(data)
    if (!payment) {
      throw new Error(
        `[mercado-pago] Payment not found for session ${this.sessionId(data) ?? 'unknown'}`,
      )
    }
    return payment
  }

  private paymentId(payment: MpPayment): string {
    if (payment.id === undefined || payment.id === null) {
      throw new Error('[mercado-pago] Mercado Pago payment has no id')
    }
    return String(payment.id)
  }

  private paymentData(payment: MpPayment, base: PaymentData): PaymentData {
    return {
      ...base,
      session_id: payment.external_reference ?? base.session_id,
      mp_payment_id:
        payment.id !== undefined && payment.id !== null
          ? String(payment.id)
          : base.mp_payment_id,
      mp_status: payment.status,
      mp_status_detail: payment.status_detail,
      mp_payment_method_id: payment.payment_method_id,
      mp_payment_type_id: payment.payment_type_id,
      mp_transaction_amount: payment.transaction_amount,
      mp_transaction_amount_refunded: payment.transaction_amount_refunded,
      mp_captured: payment.captured ?? false,
    }
  }

  private sessionStatus(payment: MpPayment): PaymentSessionStatus {
    switch (payment.status) {
      case 'approved':
        return PaymentSessionStatus.CAPTURED
      case 'authorized':
        return PaymentSessionStatus.AUTHORIZED
      case 'pending':
      case 'in_process':
        return PaymentSessionStatus.PENDING
      case 'cancelled':
        return PaymentSessionStatus.CANCELED
      case 'rejected':
        return PaymentSessionStatus.ERROR
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  private toNumber(value: unknown): number {
    if (value === undefined || value === null) {
      return 0
    }

    try {
      const numeric = new BigNumber(value as never).numeric
      return typeof numeric === 'number' ? numeric : Number(numeric)
    } catch {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }

  private storefrontUrl(): string {
    return (this.config.backUrl || 'http://localhost:8000').replace(/\/+$/, '')
  }

  private buildItems(
    data: PaymentData,
    amount: number,
    currency: string,
    sessionId?: string,
  ): PreferenceItem[] {
    const raw = Array.isArray(data.items) ? (data.items as IncomingItem[]) : []
    const items: PreferenceItem[] = []

    raw.forEach((item, index) => {
      const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1))
      const unitPrice = Number(item.unit_price)

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return
      }

      items.push({
        id: String(item.id ?? `${sessionId ?? 'item'}-${index}`),
        title: String(item.title ?? 'Producto SONOM').slice(0, 250),
        description: item.description
          ? String(item.description).slice(0, 600)
          : undefined,
        picture_url:
          typeof item.thumbnail === 'string' &&
          /^https?:\/\//.test(item.thumbnail)
            ? item.thumbnail
            : undefined,
        quantity,
        currency_id: currency,
        unit_price: unitPrice,
      })
    })

    const total = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    )

    // Never trust prices coming from the storefront payload. The payment collection
    // amount is computed server-side by Medusa, so a mismatch means tampering or a
    // stale cart: fall back to a single item for the authoritative amount.
    if (!items.length || Math.abs(total - amount) > 0.01) {
      return [
        {
          id: sessionId ?? 'sonom-order',
          title: 'Pedido SONOM',
          quantity: 1,
          currency_id: currency,
          unit_price: amount,
        },
      ]
    }

    return items
  }
}

export default MercadoPagoProvider
