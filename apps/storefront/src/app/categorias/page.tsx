import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getCategoriesWithCounts } from '@/lib/catalog'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Categorias | SONOM',
  description: 'Explora las categorias de figuras artesanales de SONOM.',
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts()

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 font-serif text-3xl font-bold text-sonom-text">
          Categorias
        </h1>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-sonom-secondary/20 bg-white p-12 text-center text-sonom-muted">
            <p className="text-lg">No hay categorias disponibles.</p>
            <p className="mt-2 text-sm">
              Intenta nuevamente en unos minutos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.handle}`}
                className="group rounded-xl border border-sonom-secondary/20 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <h2 className="font-serif text-xl font-bold text-sonom-text transition-colors group-hover:text-sonom-primary">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="mt-2 text-sm text-sonom-muted">
                    {category.description}
                  </p>
                )}
                <p className="mt-4 text-xs text-sonom-muted/60">
                  {category.productCount}{' '}
                  {category.productCount === 1 ? 'producto' : 'productos'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
