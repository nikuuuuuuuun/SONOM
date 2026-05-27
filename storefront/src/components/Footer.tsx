export function Footer() {
  return (
    <footer className="mt-auto border-t border-sonom-secondary/20 bg-sonom-text text-sonom-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Sonom</h3>
            <p className="text-sm opacity-80">
              Artesanias unicas de figuras de la historia cultural y artistica.
              Hechas a mano por talentosos artesanos mexicanos.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Enlaces</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>Sobre nosotros</li>
              <li>Contacto</li>
              <li>Preguntas frecuentes</li>
              <li>Envios y devoluciones</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contacto</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>contacto@sonom.mx</li>
              <li>+52 (55) 1234-5678</li>
              <li>Ciudad de Mexico, Mexico</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-sonom-bg/20 pt-8 text-center text-sm opacity-60">
          &copy; {new Date().getFullYear()} Sonom. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
