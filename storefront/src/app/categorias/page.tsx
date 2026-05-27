import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const categories = [
  { name: "Precolombinas", slug: "precolombinas", desc: "Figuras inspiradas en culturas precolombinas", count: 2 },
  { name: "Virreinales", slug: "virreinales", desc: "Artesanias de la epoca virreinal", count: 1 },
  { name: "Independencia", slug: "independencia", desc: "Figuras de heroes de la independencia", count: 2 },
  { name: "Revolucionarias", slug: "revolucionarias", desc: "Personajes de la revolucion mexicana", count: 2 },
  { name: "Artistas Plasticos", slug: "artistas-plasticos", desc: "Figuras de grandes artistas plasticos", count: 3 },
  { name: "Escritores", slug: "escritores", desc: "Figuras de escritores y poetas celebres", count: 3 },
  { name: "Mitologia y Leyendas", slug: "mitologia-leyendas", desc: "Figuras mitologicas y legendarias", count: 3 },
  { name: "Ciencia y Conocimiento", slug: "ciencia-conocimiento", desc: "Figuras de cientificos y pensadores", count: 1 },
]

export default function CategoriesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-sonom-text">Categorias</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categorias/${cat.slug}`}
              className="group rounded-xl border border-sonom-secondary/20 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h2 className="text-xl font-bold text-sonom-text group-hover:text-sonom-primary transition-colors">
                {cat.name}
              </h2>
              <p className="mt-2 text-sm text-sonom-muted">{cat.desc}</p>
              <p className="mt-4 text-xs text-sonom-muted/60">{cat.count} productos</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
