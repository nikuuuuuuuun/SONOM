import Link from 'next/link'
import { getCart } from '@/lib/cart'

export default async function CartBadge() {
  const cart = await getCart()
  const count = (cart?.items ?? []).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  )

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center text-sm font-medium text-sonom-text"
    >
      Cart
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
