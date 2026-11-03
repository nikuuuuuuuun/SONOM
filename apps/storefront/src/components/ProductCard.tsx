import Link from 'next/link'

type ProductCardProps = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  price: number
  currency: string
}

export function ProductCard({
  handle,
  title,
  thumbnail,
  price,
  currency,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price)

  return (
    <Link
      href={`/productos/${handle}`}
      className="group flex flex-col overflow-hidden rounded-xl2 bg-sonom-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sonom-bg">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-sonom-muted">
            Sin imagen
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-sonom-primary/90 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Artesanal
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold text-sonom-text line-clamp-2">
          {title}
        </h3>
        <p className="mt-auto pt-3 text-lg font-bold text-sonom-primary">
          {formattedPrice}
        </p>
      </div>
    </Link>
  )
}