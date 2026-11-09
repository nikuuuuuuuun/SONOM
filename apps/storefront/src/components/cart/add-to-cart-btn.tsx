'use client'
import { useState, useTransition } from 'react'
import { addToCart } from '@/actions/cart'

export function AddToCartBtn({ variantId }: { variantId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function onClick() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await addToCart(variantId, 1)
      if ('error' in res) setError(res.error)
      else setSuccess(true)
    })
  }

  return (
    <div>
      <button onClick={onClick} disabled={isPending} className="rounded-full bg-sonom-primary px-6 py-3 text-white">
        {isPending ? 'Adding...' : 'Agregar al carrito'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">Agregado</p>}
    </div>
  )
}