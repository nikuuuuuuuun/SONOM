import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const categories = [
  { name: 'Precolombinas', slug: 'precolombinas', desc: 'Culturas ancestrales', color: 'from-amber-700 to-amber-900' },
  { name: 'Revolucionarias', slug: 'revolucionarias', desc: 'Heroes revolucionarios', color: 'from-red-700 to-red-900' },
  { name: 'Artistas', slug: 'artistas-plasticos', desc: 'Grandes creadores', color: 'from-blue-600 to-blue-800' },
  { name: 'Escritores', slug: 'escritores', desc: 'Letras y poesia', color: 'from-purple-600 to-purple-800' },
  { name: 'Mitologia', slug: 'mitologia-leyendas', desc: 'Leyendas y mitos', color: 'from-green-700 to-green-900' },
  { name: 'Independencia', slug: 'independencia', desc: 'Patria y libertad', color: 'from-green-600 to-green-800' },
]

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-sonom-primary to-sonom-text py-24 text-center text-white">
          <div className="mx-auto max-w-4xl px-4">
            <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-6xl">
              Sonom
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
              Artesanias de figuras de la historia cultural y artistica.
              Piezas unicas hechas a mano por artesanos mexicanos.
            </p>
            <Link
              href="/productos"
              className="mt-8 inline-block rounded-full bg-sonom-accent px-8 py-3 text-lg font-semibold text-sonom-text transition-colors hover:bg-yellow-400"
            >
              Explorar coleccion
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-sonom-text">
            Categorias
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${cat.color} p-8 text-white shadow-lg transition-transform hover:scale-[1.02]`}
              >
                <h3 className="font-serif text-2xl font-bold">{cat.name}</h3>
                <p className="mt-2 text-white/70">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-sonom-text/5 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-6 font-serif text-3xl font-bold text-sonom-text">
              Hecho a mano con tradicion
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-sonom-muted">
              Cada figura es creada por artesanos utilizando tecnicas tradicionales
              transmitidas de generacion en generacion. Barro, ceramica, madera y
              cera son algunos de los materiales que cobran vida en nuestras piezas.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
