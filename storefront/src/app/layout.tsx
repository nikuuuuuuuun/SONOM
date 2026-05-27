import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sonom - Artesanias de Figuras Historicas",
  description:
    "Artesanias unicas de figuras de la historia cultural y artistica. Piezas hechas a mano por artesanos mexicanos.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
