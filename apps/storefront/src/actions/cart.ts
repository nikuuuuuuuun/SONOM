'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getRegionId, storeFetch } from '@/lib/api'
import { CART_COOKIE } from '@/lib/constants'

type ActionResult = { success: true } | { error: string }

export async function addToCart(
  variantId: string,
  quantity = 1,
): Promise<ActionResult> {
  try {
    const store = await cookies()
    let cartId = store.get(CART_COOKIE)?.value

    if (!cartId) {
      const regionId = await getRegionId()
      if (!regionId) {
        return { error: 'La tienda no tiene una region configurada.' }
      }

      const created = await storeFetch<{ cart: { id: string } }>(
        '/store/carts',
        {
          method: 'POST',
          body: JSON.stringify({ region_id: regionId }),
          cache: 'no-store',
        },
      )

      cartId = created.cart.id
      store.set(CART_COOKIE, cartId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    await storeFetch(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
      cache: 'no-store',
    })

    revalidatePath('/', 'layout')
    revalidatePath('/cart')
    revalidatePath('/checkout')

    return { success: true }
  } catch (error) {
    console.error('[sonom/storefront] addToCart failed', error)
    return { error: 'No se pudo agregar el producto. Intenta nuevamente.' }
  }
}

export async function clearCart(): Promise<void> {
  const store = await cookies()
  store.delete(CART_COOKIE)
  revalidatePath('/', 'layout')
  revalidatePath('/cart')
  revalidatePath('/checkout')
}
