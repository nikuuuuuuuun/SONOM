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
  return (
    <Link
      href={`/productos/${handle}`}
      className="group rounded-lg border border-sonom-secondary/20 bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-4 aspect-square overflow-hidden rounded-md bg-sonom-bg">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-sonom-muted">
            Sin imagen
          </div>
        )}
      </div>
      <h3 className="font-medium text-sonom-text">{title}</h3>
      <p className="mt-1 text-lg font-bold text-sonom-primary">
        ${price.toFixed(2)} {currency.toUpperCase()}
      </p>
    </Link>
  )
}
