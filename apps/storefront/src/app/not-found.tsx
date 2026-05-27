import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex-1 px-4 py-24 text-center">
        <h1 className="font-serif text-6xl font-bold text-sonom-primary">404</h1>
        <p className="mt-4 text-lg text-sonom-muted">
          Pagina no encontrada
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-sonom-primary px-8 py-3 text-white transition-colors hover:bg-sonom-secondary"
        >
          Volver al inicio
        </Link>
      </main>
      <Footer />
    </>
  )
}
