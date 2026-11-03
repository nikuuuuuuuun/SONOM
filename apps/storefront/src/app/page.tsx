import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'
import { getRegionId } from '@/lib/medusa'

async function getFeaturedProducts() {
  try {
    const regionId = await getRegionId()
    const url = new URL(`${BACKEND_URL}/store/products`)
    url.searchParams.set('limit', '4')
    if (regionId) url.searchParams.set('region_id', regionId)
    const res = await fetch(url.toString(), {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.products || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts()
  const featured = products[0]

  const price = featured?.variants?.[0]?.calculated_price?.calculated_amount ?? 0
  const currency = (featured?.variants?.[0]?.calculated_price?.currency_code ?? 'clp').toUpperCase()
  const formattedPrice = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price)

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-sonom-bg">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-sonom-muted">
                Hecho a mano
              </p>
              <h1 className="text-4xl font-bold leading-tight text-sonom-text sm:text-5xl lg:text-6xl">
                Artesanias de figuras con beneficios que sentiras
              </h1>
              <p className="mt-6 max-w-xl text-lg text-sonom-muted">
                Piezas unicas creadas por artesanos. Calidad, tradicion y diseno en cada detalle.
              </p>
              <Link
                href="/productos"
                className="mt-8 inline-block rounded-full bg-sonom-primary px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-sonom-secondary"
              >
                Shop Now
              </Link>
              <p className="mt-6 text-sm text-sonom-muted">Basado en 1,000+ resenas</p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl2 bg-sonom-secondary/10">
                <img
                  src="https://placehold.co/900x675/1F3B34/FFFFFF?text=Hero+Placeholder"
                  alt="Hero placeholder"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Best selling product */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-sonom-muted">
              Our Best-Selling
            </p>
            <h2 className="mt-2 text-3xl font-bold text-sonom-text sm:text-4xl">
              The Anytime You<br />Collectible Figure
            </h2>
            <p className="mt-4 max-w-2xl text-sonom-muted">
              Pieza artesanal para que despiertes sintiendote mejor de lo que deberias.
            </p>
            <ul className="mt-6 space-y-3 text-sonom-text">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-sonom-primary" />
                Soporta la tradicion artesanal
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-sonom-primary" />
                Promueve el arte popular
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-sonom-primary" />
                Restaura piezas unicas
              </li>
            </ul>
            {featured ? (
              <div className="mt-8 flex items-center gap-6">
                <Link
                  href={`/productos/${featured.handle}`}
                  className="rounded-full bg-sonom-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-sonom-secondary"
                >
                  Shop Now {formattedPrice && `· ${formattedPrice}`}
                </Link>
              </div>
            ) : (
              <Link href="/productos" className="mt-8 inline-block rounded-full bg-sonom-primary px-8 py-3 font-semibold text-white">
                Shop Now
              </Link>
            )}
          </div>
          <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl2 bg-sonom-secondary/10">
              <img src="https://placehold.co/1200x675/2F5D50/FFFFFF?text=Product+Placeholder" alt="Product placeholder" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        {/* Introducing second product */}
        <section className="bg-sonom-bg py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl2 bg-sonom-secondary/10">
              <img src="https://placehold.co/900x675/C9A227/FFFFFF?text=Energy+Placeholder" alt="Energy placeholder" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-sonom-muted">
                Introducing
              </p>
              <h2 className="mt-2 text-3xl font-bold text-sonom-text sm:text-4xl">
                The Anytime You<br />Need Energy Vitamin
              </h2>
              <p className="mt-4 text-sonom-muted">
                Piezas que impulsan tu dia con energia sin altibajos.
              </p>
              <ul className="mt-6 space-y-3 text-sonom-text">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sonom-primary" />
                  Promueve energia sin nerviosismo
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sonom-primary" />
                  Apoya el enfoque y la alerta
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sonom-primary" />
                  Previene caidas de energia
                </li>
              </ul>
              <Link href="/productos" className="mt-8 inline-block rounded-full bg-sonom-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-sonom-secondary">
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* Doctor / benefits */}
        <section className="bg-white py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl2 bg-sonom-secondary/10">
              <img src="https://placehold.co/900x675/1F3B34/FFFFFF?text=Doctor+Placeholder" alt="Doctor placeholder" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-sonom-text">Benefits You&apos;ll Feel</h2>
              <ul className="mt-6 space-y-4">
                {[
                  'Developed by a board-certified artisan master',
                  'Patented / patent-pending designs',
                  'Materials supported by tradition',
                  'Extensive R&D, including customer field trials',
                  'Made with care in our workshop',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sonom-text">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sonom-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Guarantee */}
        <section className="bg-sonom-bg py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold text-sonom-text">Feel Good, Guaranteed</h2>
            <p className="mt-4 text-sonom-muted">
              Queremos que pruebes SONOM sin riesgo. Si no estas satisfecho con tu primera compra, avisanos dentro de 30 dias y te reembolsamos.
            </p>
            <div className="mt-8 flex justify-center gap-8 text-sonom-text">
              <div className="text-center">
                <div className="text-2xl font-bold">30</div>
                <div className="text-sm text-sonom-muted">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">Risk</div>
                <div className="text-sm text-sonom-muted">Free</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">Refund</div>
                <div className="text-sm text-sonom-muted">Guaranteed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Video reviews placeholders */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-sonom-text">How People Really Feel</h2>
            <p className="mt-2 text-center text-sonom-muted">Based on 1,000+ Reviews</p>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video w-full overflow-hidden rounded-xl2 bg-sonom-secondary/20">
                  <div className="flex h-full items-center justify-center text-sonom-muted">
                    Video placeholder {i}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/productos" className="text-sm font-medium text-sonom-primary hover:underline">
                Read All Reviews
              </Link>
            </div>
          </div>
        </section>

        {/* Press logos */}
        <section className="bg-sonom-bg py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-sonom-muted">
              Featured In
            </h3>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex h-12 items-center justify-center rounded bg-white text-xs text-sonom-muted shadow-card">
                  Logo {i}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-sonom-primary py-16 text-white">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-bold">Sign up for exclusive offers</h2>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 rounded-full px-5 py-3 text-sonom-text outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-sonom-accent px-6 py-3 font-semibold text-sonom-primary transition-colors hover:bg-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}