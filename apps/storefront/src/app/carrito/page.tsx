import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 font-serif text-3xl font-bold text-sonom-text">
          Carrito de compras
        </h1>
        <div className="rounded-xl border border-sonom-secondary/20 bg-white p-12 text-center">
          <p className="text-lg text-sonom-muted">Tu carrito esta vacio</p>
          <p className="mt-2 text-sm text-sonom-muted/60">
            Agrega productos desde nuestro catalogo para comenzar tu compra.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
