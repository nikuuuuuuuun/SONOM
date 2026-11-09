import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { getCategoryByHandle, getProducts } from '@/lib/catalog'

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryByHandle(slug)

  if (!category) {
    return { title: 'Categoria no encontrada | SONOM' }
  }

  return {
    title: `${category.name} | SONOM`,
    description:
      category.description ??
      `Figuras artesanales de la categoria ${category.name}.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryByHandle(slug)

  if (!category) {
    notFound()
  }

  const products = await getProducts({ categoryId: category.id, limit: 100 })

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-sonom-text">
          {category.name}
        </h1>
        <p className="mb-8 text-sonom-muted">
          {products.length} producto{products.length !== 1 ? 's' : ''} en esta
          categoria
        </p>

        {products.length === 0 ? (
          <div className="py-20 text-center text-sonom-muted">
            <p className="text-lg">
              Todavia no hay productos en esta categoria.
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
