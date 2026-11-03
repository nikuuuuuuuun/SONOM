export function Footer() {
  return (
    <footer className="mt-auto bg-sonom-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-xl font-bold">SONOM</h3>
            <p className="mt-3 text-sm leading-relaxed opacity-80">
              Artesanias unicas de figuras de la historia cultural y artistica.
            </p>
            <div className="mt-4 flex gap-4 text-sm opacity-80">
              <a href="#" aria-label="Facebook">Facebook</a>
              <a href="#" aria-label="Instagram">Instagram</a>
              <a href="#" aria-label="TikTok">TikTok</a>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="/productos">All Products</a></li>
              <li><a href="/categorias">Categorias</a></li>
              <li><a href="#">Where To Find Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Learn</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#">Our Story</a></li>
              <li><a href="#">Our Standards</a></li>
              <li><a href="#">Reviews</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Support</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Shipping & Returns</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/20 pt-6 text-center text-xs opacity-60">
          &copy; {new Date().getFullYear()} Sonom. All rights reserved.
        </div>
      </div>
    </footer>
  )
}