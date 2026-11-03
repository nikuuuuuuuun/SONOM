import { notFound } from 'next/navigation'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getRegionId } from '@/lib/medusa'
import AddToCartBtn from '@/components/cart/add-to-cart-btn'

async function getProduct(handle: string) {
  try {
    const regionId = await getRegionId()
    const url = new URL(`${BACKEND_URL}/store/products`)
    url.searchParams.set('handle', handle)
    if (regionId) url.searchParams.set('region_id', regionId)
    const res = await fetch(url.toString(), {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    })
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

  const variant = product.variants?.[0]
  const cp = variant?.calculated_price
  const amount = cp?.calculated_amount ?? 0
  const currency = (cp?.currency_code ?? 'clp').toUpperCase()

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount)

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl2 bg-sonom-bg shadow-card">
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

          <div className="flex flex-col">
            <p className="text-sm uppercase tracking-[0.3em] text-sonom-muted">
              Artesania unica
            </p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-sonom-text">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="mt-2 text-lg text-sonom-muted">{product.subtitle}</p>
            )}
            <p className="mt-6 text-3xl font-bold text-sonom-primary">
              {formattedPrice}
            </p>

            {product.description && (
              <div className="mt-8">
                <h2 className="mb-3 font-serif text-lg font-semibold text-sonom-text">
                  Descripcion
                </h2>
                <p className="leading-relaxed text-sonom-muted whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-10">
              <AddToCartBtn variantId={product.variants?.[0]?.id} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}