import Link from 'next/link'
import CartBadge from '@/components/layout/cart-badge'
import MobileMenu from '@/components/MobileMenu'

export function Header() {
  return (
    <>
      <div className="bg-sonom-primary text-center text-sm text-white">
        <div className="mx-auto max-w-7xl px-4 py-2">Free Standard Shipping</div>
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-sonom-secondary/10 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-sonom-primary">SONOM</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-sonom-text md:flex">
            <Link href="/productos" className="transition-colors hover:text-sonom-primary">Shop</Link>
            <Link href="/categorias" className="transition-colors hover:text-sonom-primary">Categorias</Link>
            <Link href="#" className="transition-colors hover:text-sonom-primary">Supported By Science</Link>
            <Link href="#" className="transition-colors hover:text-sonom-primary">Who We Are</Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login" className="text-sm font-medium text-sonom-text hover:text-sonom-primary">Log in</Link>
            <CartBadge />
          </div>

          <MobileMenu />
        </div>
      </header>
    </>
  )
}