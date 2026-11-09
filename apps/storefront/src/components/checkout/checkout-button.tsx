'use client'

import { useActionState } from 'react'
import { startCheckout, type CheckoutState } from '@/actions/checkout'

const initialState: CheckoutState = {}

export function CheckoutButton() {
  const [state, formAction, pending] = useActionState(
    startCheckout,
    initialState,
  )

  return (
    <form action={formAction} className="flex flex-col items-end gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sonom-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-sonom-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
