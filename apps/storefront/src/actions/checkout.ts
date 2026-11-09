'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCartById } from '@/lib/cart'
import { CART_COOKIE } from '@/lib/constants'
import { storeFetch } from '@/lib/api'

const MERCADO_PAGO_PROVIDER_ID = 'pp_mercado-pago_mercado-pago'

export type CheckoutState = {
  error?: string
}

type PaymentCollectionResponse = {
  payment_collection: {
    id: string
    payment_sessions?: Array<{
      data?: {
        init_point?: string
      }
    }>
  }
}

export async function startCheckout(
  _previousState: CheckoutState,
  _formData: FormData,
): Promise<CheckoutState> {
  const store = await cookies()
  const cartId = store.get(CART_COOKIE)?.value

  if (!cartId) {
    return { error: 'No hay un carrito activo.' }
  }

  const cart = await getCartById(cartId)
  if (!cart?.items?.length) {
    return { error: 'Tu carrito esta vacio.' }
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    title: item.product_title ?? item.title,
    description: item.variant_title ?? undefined,
    thumbnail: item.thumbnail ?? undefined,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }))

  let initPoint: string | undefined

  try {
    const collection = await storeFetch<PaymentCollectionResponse>(
      '/store/payment-collections',
      {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartId }),
        cache: 'no-store',
      },
    )

    const session = await storeFetch<PaymentCollectionResponse>(
      `/store/payment-collections/${collection.payment_collection.id}/payment-sessions`,
      {
        method: 'POST',
        body: JSON.stringify({
          provider_id: MERCADO_PAGO_PROVIDER_ID,
          data: { cart_id: cartId, items },
        }),
        cache: 'no-store',
      },
    )

    initPoint =
      session.payment_collection?.payment_sessions?.[0]?.data?.init_point
  } catch (error) {
    console.error('[sonom/storefront] startCheckout failed', error)
    return { error: 'No se pudo iniciar el pago. Intenta nuevamente.' }
  }

  if (!initPoint) {
    return { error: 'Mercado Pago no devolvio una URL de pago.' }
  }

  redirect(initPoint)
}
