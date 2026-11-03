'use client'
import { useEffect } from 'react'

export default function MercadoPagoButton({ preferenceId }: { preferenceId: string }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      const mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, { locale: 'es-CL' })
      mp.checkout({ preference: { id: preferenceId } })
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [preferenceId])

  return <div id="mp-checkout" />
}