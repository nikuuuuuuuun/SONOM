import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'

async function getProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/store/products?pagination_type=take&limit=50`, {
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
        <h1 className="mb-8 font-serif text-3xl font-bold text-sonom-text">
          Todos los productos
        </h1>

        {products.length === 0 ? (
          <div className="py-20 text-center text-sonom-muted">
            <p className="text-lg">
              Conecta el backend de Medusa para ver los productos.
            </p>
            <p className="mt-2 text-sm">
              Ejecuta <code className="rounded bg-sonom-text/10 px-2 py-1">pnpm backend:dev</code> en la raiz del proyecto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                handle={product.handle}
                title={product.title}
                thumbnail={product.thumbnail}
                price={product.variants?.[0]?.prices?.[0]?.amount / 100 || 0}
                currency={product.variants?.[0]?.prices?.[0]?.currency_code || 'mxn'}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
