import { cookies } from 'next/headers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import MercadoPagoButton from '@/components/checkout/mercado-pago-button'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'

async function getCart(cartId: string) {
  const res = await fetch(`${BACKEND_URL}/store/carts/${cartId}`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.cart
}

async function createPaymentSession(cartId: string) {
  const pcRes = await fetch(`${BACKEND_URL}/store/payment-collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
    body: JSON.stringify({ cart_id: cartId }),
  })
  if (!pcRes.ok) return null
  const pcJson = await pcRes.json()
  const collectionId = pcJson.payment_collection.id

  const psRes = await fetch(`${BACKEND_URL}/store/payment-collections/${collectionId}/payment-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
    body: JSON.stringify({ provider_id: 'pp_mercado-pago_mercado-pago' }),
  })
  if (!psRes.ok) return null
  const psJson = await psRes.json()
  const session = psJson.payment_session || psJson.payment_collection?.payment_sessions?.[0]
  return session?.data?.preference_id || session?.data?.id
}

export default async function CheckoutPage() {
  const store = await cookies()
  const cartId = store.get('cart_id')?.value

  if (!cartId) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-sonom-muted">No hay carrito activo.</p>
        </main>
        <Footer />
      </>
    )
  }

  const cart = await getCart(cartId)
  const preferenceId = await createPaymentSession(cartId)

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-6 text-2xl font-bold text-sonom-text">Checkout</h1>
        {cart && (
          <p className="mb-6 text-sonom-muted">
            Total: {cart.total} {cart.currency_code?.toUpperCase()}
          </p>
        )}
        {preferenceId ? (
          <MercadoPagoButton preferenceId={preferenceId} />
        ) : (
          <p className="text-red-600">No se pudo inicializar MercadoPago.</p>
        )}
      </main>
      <Footer />
    </>
  )
}