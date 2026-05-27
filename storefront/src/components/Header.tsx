import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-sonom-secondary/20 bg-sonom-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-sonom-primary">Sonom</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-sonom-muted">
          <Link href="/" className="hover:text-sonom-primary transition-colors">
            Inicio
          </Link>
          <Link href="/productos" className="hover:text-sonom-primary transition-colors">
            Productos
          </Link>
          <Link href="/categorias" className="hover:text-sonom-primary transition-colors">
            Categorias
          </Link>
          <Link
            href="/carrito"
            className="ml-4 rounded-full bg-sonom-primary px-4 py-2 text-white hover:bg-sonom-secondary transition-colors"
          >
            Carrito (0)
          </Link>
        </nav>
      </div>
    </header>
  )
}
