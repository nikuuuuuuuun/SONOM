'use server'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { getRegionId } from '@/lib/medusa'

export async function addToCart(variantId: string, quantity = 1) {
  try {
    const store = await cookies()
    let cartId = store.get('cart_id')?.value

    if (!cartId) {
      const regionId = await getRegionId()
      const res = await fetch(`${BACKEND_URL}/store/carts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
        body: JSON.stringify({ region_id: regionId }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Create cart failed', res.status, text)
        return { error: text }
      }
      const json = await res.json()
      cartId = json.cart.id
      store.set('cart_id', cartId!, { httpOnly: true, sameSite: 'lax', path: '/' })
    }

    const res = await fetch(`${BACKEND_URL}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY },
      body: JSON.stringify({ variant_id: variantId, quantity }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('Add line item failed', res.status, text)
      return { error: text }
    }

    revalidateTag('cart')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e) {
    console.error('addToCart exception', e)
    return { error: 'Unexpected error adding to cart' }
  }
}