import { notFound } from 'next/navigation'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

async function getProduct(handle: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?handle=${handle}`,
      {
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.products?.[0] || null
  } catch {
    return null
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    notFound()
  }

  const price = product.variants?.[0]?.prices?.[0]
  const amount = price ? (price.amount / 100).toFixed(2) : '0.00'
  const currency = price?.currency_code?.toUpperCase() || 'MXN'

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-sonom-bg">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sonom-muted">
                Sin imagen disponible
              </div>
            )}
          </div>

          <div>
            <h1 className="font-serif text-4xl font-bold text-sonom-text">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="mt-2 text-lg text-sonom-muted">{product.subtitle}</p>
            )}
            <p className="mt-6 text-3xl font-bold text-sonom-primary">
              ${amount} {currency}
            </p>

            {product.description && (
              <div className="mt-8">
                <h2 className="mb-3 font-serif text-lg font-semibold text-sonom-text">
                  Descripcion
                </h2>
                <p className="leading-relaxed text-sonom-muted">
                  {product.description}
                </p>
              </div>
            )}

            <button className="mt-10 w-full rounded-full bg-sonom-primary px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-sonom-secondary">
              Agregar al carrito
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
