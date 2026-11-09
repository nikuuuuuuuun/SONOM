import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { getProducts } from '@/lib/catalog'

export const revalidate = 60

export default async function ProductsPage() {
  const products = await getProducts({ limit: 100 })

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
              No pudimos cargar los productos en este momento.
            </p>
            <p className="mt-2 text-sm">
              Verifica que el backend de Medusa este disponible.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const variant = product.variants?.[0]
              const price = variant?.calculated_price

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  handle={product.handle}
                  title={product.title}
                  thumbnail={product.thumbnail}
                  price={price?.calculated_amount ?? 0}
                  currency={price?.currency_code ?? 'clp'}
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
