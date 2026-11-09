import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CheckoutButton } from '@/components/checkout/checkout-button'
import { getCart } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const cart = await getCart()
  const items = cart?.items ?? []
  const currency = (cart?.currency_code ?? 'clp').toUpperCase()
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
  })

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-16">
          <p className="text-sonom-muted">No hay un carrito activo.</p>
          <Link
            href="/productos"
            className="mt-6 inline-block rounded-full bg-sonom-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Ver productos
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="mb-8 text-2xl font-bold text-sonom-text">Checkout</h1>

        <ul className="space-y-3 rounded-xl border border-sonom-secondary/20 bg-white p-6">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-sonom-text">
                {item.product_title ?? item.title} x {item.quantity}
              </span>
              <span className="font-medium text-sonom-text">
                {formatter.format(item.total ?? item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-right text-xl font-bold text-sonom-text">
          Total: {formatter.format(cart?.total ?? 0)}
        </p>

        <div className="mt-8">
          <CheckoutButton />
        </div>
      </main>
      <Footer />
    </>
  )
}
