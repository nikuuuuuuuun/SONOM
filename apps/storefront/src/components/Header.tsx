'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sonom-secondary/20 bg-sonom-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-sonom-primary">
            Sonom
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-sonom-muted md:flex">
          <Link
            href="/productos"
            className="transition-colors hover:text-sonom-primary"
          >
            Productos
          </Link>
          <Link
            href="/categorias"
            className="transition-colors hover:text-sonom-primary"
          >
            Categorias
          </Link>
          <Link
            href="/carrito"
            className="rounded-full bg-sonom-primary px-5 py-2 text-white transition-colors hover:bg-sonom-secondary"
          >
            Carrito
          </Link>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-sonom-secondary/20 bg-sonom-bg px-4 pb-4 md:hidden">
          <Link
            href="/productos"
            className="block py-2 text-sm font-medium text-sonom-muted hover:text-sonom-primary"
            onClick={() => setMobileOpen(false)}
          >
            Productos
          </Link>
          <Link
            href="/categorias"
            className="block py-2 text-sm font-medium text-sonom-muted hover:text-sonom-primary"
            onClick={() => setMobileOpen(false)}
          >
            Categorias
          </Link>
          <Link
            href="/carrito"
            className="mt-2 block rounded-full bg-sonom-primary px-5 py-2 text-center text-sm font-medium text-white"
            onClick={() => setMobileOpen(false)}
          >
            Carrito
          </Link>
        </nav>
      )}
    </header>
  )
}
