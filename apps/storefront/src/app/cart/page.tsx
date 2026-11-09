import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getCart } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const cart = await getCart()
  const items = cart?.items ?? []
  const currency = (cart?.currency_code ?? 'clp').toUpperCase()
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
  })

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-sonom-text">Carrito</h1>

        {items.length === 0 ? (
          <div className="rounded-xl border border-sonom-secondary/20 bg-white p-12 text-center">
            <p className="text-sonom-muted">Tu carrito esta vacio.</p>
            <Link
              href="/productos"
              className="mt-6 inline-block rounded-full bg-sonom-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sonom-secondary"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-sonom-secondary/20 bg-white p-4"
                >
                  <div>
                    <p className="font-medium text-sonom-text">
                      {item.product_title ?? item.title}
                    </p>
                    {item.variant_title && (
                      <p className="text-sm text-sonom-muted">
                        {item.variant_title}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-sonom-muted">
                      {item.quantity} x {formatter.format(item.unit_price)}
                    </p>
                  </div>
                  <span className="font-semibold text-sonom-text">
                    {formatter.format(
                      item.total ?? item.unit_price * item.quantity,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-end gap-4">
              <p className="text-xl font-bold text-sonom-text">
                Total: {formatter.format(cart?.total ?? 0)}
              </p>
              <Link
                href="/checkout"
                className="rounded-full bg-sonom-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-sonom-secondary"
              >
                Ir al checkout
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
