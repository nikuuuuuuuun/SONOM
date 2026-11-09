'use client'

import { useEffect, useRef } from 'react'
import { clearCart } from '@/actions/cart'

export function ClearCartOnSuccess({ enabled }: { enabled: boolean }) {
  const started = useRef(false)

  useEffect(() => {
    if (enabled && !started.current) {
      started.current = true
      void clearCart()
    }
  }, [enabled])

  return null
}
