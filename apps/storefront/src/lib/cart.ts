import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { CART_COOKIE } from '@/lib/constants'
import { storeFetch } from '@/lib/api'

export type StoreCartItem = {
  id: string
  title: string
  product_title?: string | null
  variant_title?: string | null
  thumbnail?: string | null
  quantity: number
  unit_price: number
  total?: number
}

export type StoreCart = {
  id: string
  currency_code: string
  items?: StoreCartItem[]
  item_total?: number
  shipping_total?: number
  tax_total?: number
  total?: number
}

export async function getCartId(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value
}

export const getCartById = cache(
  async (cartId: string): Promise<StoreCart | null> => {
    try {
      const data = await storeFetch<{ cart: StoreCart }>(
        `/store/carts/${cartId}`,
        { cache: 'no-store' },
      )
      return data.cart ?? null
    } catch (error) {
      console.error(`[sonom/storefront] Could not load cart ${cartId}`, error)
      return null
    }
  },
)

export const getCart = cache(async (): Promise<StoreCart | null> => {
  const cartId = await getCartId()
  return cartId ? getCartById(cartId) : null
})
