import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { getRegionId } from '@/lib/medusa'

async function getProducts() {
  try {
    const regionId = await getRegionId()
    const url = new URL(`${BACKEND_URL}/store/products`)
    url.searchParams.set('limit', '50')
    if (regionId) url.searchParams.set('region_id', regionId)
    const res = await fetch(url.toString(), {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.products || []
  } catch {
    return []
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sonom-muted">
            Coleccion
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-sonom-text">
            Todos los productos
          </h1>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl2 bg-sonom-surface py-20 text-center text-sonom-muted shadow-card">
            <p className="text-lg">
              Conecta el backend de Medusa para ver los productos.
            </p>
            <p className="mt-2 text-sm">
              Ejecuta <code className="rounded bg-sonom-text/10 px-2 py-1">pnpm backend:dev</code> en la raiz del proyecto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => {
              const variant = product.variants?.[0]
              const cp = variant?.calculated_price
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  handle={product.handle}
                  title={product.title}
                  thumbnail={product.thumbnail}
                  price={cp?.calculated_amount ?? 0}
                  currency={cp?.currency_code ?? 'clp'}
                />
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}