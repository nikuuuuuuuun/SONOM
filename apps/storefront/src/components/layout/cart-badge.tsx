import { cookies } from 'next/headers'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'

export default async function CartBadge() {
  const store = await cookies()
  const cartId = store.get('cart_id')?.value
  let count = 0

  if (cartId) {
    try {
      const res = await fetch(`${BACKEND_URL}/store/carts/${cartId}`, {
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
        cache: 'no-store',
      })
      if (res.ok) {
        const json = await res.json()
        count = (json.cart?.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
      }
    } catch (e) {
      console.error('CartBadge fetch failed', e)
    }
  }

  return (
    <a href="/cart" className="relative inline-flex items-center text-sm font-medium text-sonom-text">
      Cart
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
          {count}
        </span>
      )}
    </a>
  )
}