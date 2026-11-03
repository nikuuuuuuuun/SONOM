export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
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

export default async function CartPage() {
  const store = await cookies()
  const cartId = store.get('cart_id')?.value
  const cart = cartId ? await getCart(cartId) : null
  const items = cart?.items || []

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl flex-1 px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-sonom-text">Carrito</h1>
        {items.length === 0 ? (
          <p className="text-sonom-muted">Tu carrito está vacío.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item: any) => (
              <li key={item.id} className="flex items-center justify-between rounded border p-4">
                <span>{item.title} × {item.quantity}</span>
                <span>{item.unit_price}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  )
}