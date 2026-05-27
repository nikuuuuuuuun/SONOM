import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sonom - Artesanias de Figuras Historicas',
  description:
    'Artesanias unicas de figuras de la historia cultural y artistica. Piezas hechas a mano por artesanos mexicanos.',
  keywords: [
    'artesanias',
    'figuras historicas',
    'cultura mexicana',
    'arte popular',
    'hecho a mano',
  ],
  openGraph: {
    title: 'Sonom - Artesanias de Figuras Historicas',
    description:
      'Artesanias unicas de figuras de la historia cultural y artistica.',
    locale: 'es_MX',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-MX">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
