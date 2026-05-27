import { notFound } from 'next/navigation'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'

async function getProductsByCategory(slug: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?category_id[]=${slug}`,
      {
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.products || []
  } catch {
    return []
  }
}

const categoryNames: Record<string, string> = {
  precolombinas: 'Precolombinas',
  virreinales: 'Virreinales',
  independencia: 'Independencia',
  revolucionarias: 'Revolucionarias',
  'artistas-plasticos': 'Artistas Plasticos',
  escritores: 'Escritores',
  'musica-danza': 'Musica y Danza',
  'cine-tv': 'Cine y Television',
  'mitologia-leyendas': 'Mitologia y Leyendas',
  'ciencia-conocimiento': 'Ciencia y Conocimiento',
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const categoryName = categoryNames[slug]

  if (!categoryName) {
    notFound()
  }

  const products = await getProductsByCategory(slug)

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-sonom-text">
          {categoryName}
        </h1>
        <p className="mb-8 text-sonom-muted">
          {products.length} producto{products.length !== 1 ? 's' : ''} en esta
          categoria
        </p>

        {products.length === 0 ? (
          <div className="py-20 text-center text-sonom-muted">
            <p className="text-lg">
              Conecta el backend de Medusa y agrega productos a esta categoria.
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
