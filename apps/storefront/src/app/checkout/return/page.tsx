import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ClearCartOnSuccess } from '@/components/checkout/clear-cart'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resultado del pago | SONOM',
}

type ReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type PaymentResult = 'success' | 'pending' | 'failure'

const CONTENT: Record<
  PaymentResult,
  { title: string; description: string; className: string }
> = {
  success: {
    title: 'Pago aprobado',
    description:
      'Recibimos tu pago. Estamos generando tu pedido y te enviaremos la confirmacion por correo.',
    className: 'text-sonom-primary',
  },
  pending: {
    title: 'Pago pendiente',
    description:
      'Mercado Pago esta procesando tu pago. Te avisaremos por correo cuando se confirme.',
    className: 'text-sonom-accent',
  },
  failure: {
    title: 'Pago no completado',
    description:
      'No pudimos confirmar el pago. Puedes intentarlo nuevamente desde tu carrito.',
    className: 'text-red-600',
  },
}

function resolveResult(
  status: string | string[] | undefined,
  collectionStatus: string | string[] | undefined,
): PaymentResult {
  const value = String(status ?? collectionStatus ?? '').toLowerCase()

  if (value === 'success' || value === 'approved') {
    return 'success'
  }
  if (value === 'pending' || value === 'in_process') {
    return 'pending'
  }
  return 'failure'
}

export default async function CheckoutReturnPage({
  searchParams,
}: ReturnPageProps) {
  const params = await searchParams
  const result = resolveResult(params.status, params.collection_status)
  const content = CONTENT[result]
  const paymentId = params.payment_id

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-20">
        <div className="rounded-xl border border-sonom-secondary/20 bg-white p-10 text-center">
          <h1 className={`text-2xl font-bold ${content.className}`}>
            {content.title}
          </h1>
          <p className="mt-4 text-sonom-muted">{content.description}</p>

          {paymentId && (
            <p className="mt-4 text-xs text-sonom-muted/70">
              ID de pago: {String(paymentId)}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/productos"
              className="rounded-full bg-sonom-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Seguir comprando
            </Link>
            {result !== 'success' && (
              <Link
                href="/cart"
                className="rounded-full border border-sonom-secondary/30 px-6 py-3 text-sm font-semibold text-sonom-text"
              >
                Volver al carrito
              </Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <ClearCartOnSuccess enabled={result === 'success'} />
    </>
  )
}
