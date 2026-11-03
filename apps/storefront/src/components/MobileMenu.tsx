'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
        <svg className="h-6 w-6 text-sonom-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      {open && (
        <nav className="border-t border-sonom-secondary/10 bg-white px-4 pb-4 md:hidden">
          <Link href="/productos" className="block py-2 text-sm font-medium text-sonom-muted hover:text-sonom-primary" onClick={() => setOpen(false)}>
            Shop
          </Link>
          <Link href="/categorias" className="block py-2 text-sm font-medium text-sonom-muted hover:text-sonom-primary" onClick={() => setOpen(false)}>
            Categorias
          </Link>
          <Link href="/login" className="block py-2 text-sm font-medium text-sonom-muted hover:text-sonom-primary" onClick={() => setOpen(false)}>
            Log in
          </Link>
          <Link href="/cart" className="mt-2 block rounded-full bg-sonom-primary px-5 py-2 text-center text-sm font-medium text-white" onClick={() => setOpen(false)}>
            Cart
          </Link>
        </nav>
      )}
    </>
  )
}