import { getRegionId, storeFetch } from '@/lib/api'

export type StoreCategory = {
  id: string
  name: string
  handle: string
  description?: string | null
}

export type StoreCategoryWithCount = StoreCategory & {
  productCount: number
}

export type StoreProduct = {
  id: string
  handle: string
  title: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  categories?: Array<{ id: string }>
  variants?: Array<{
    id: string
    calculated_price?: {
      calculated_amount: number
      currency_code: string
    } | null
  }>
}

type CategoryListResponse = {
  product_categories: StoreCategory[]
  count: number
}

type ProductListResponse = {
  products: StoreProduct[]
  count: number
}

const CATEGORY_FIELDS = 'id,name,handle,description'
const CATEGORY_REVALIDATE = 300
const PRODUCT_REVALIDATE = 60

export async function getCategories(): Promise<StoreCategory[]> {
  try {
    const data = await storeFetch<CategoryListResponse>(
      `/store/product-categories?limit=100&fields=${CATEGORY_FIELDS}`,
      { next: { revalidate: CATEGORY_REVALIDATE, tags: ['categories'] } },
    )

    return (data.product_categories ?? []).filter(
      (category) => category.handle && category.name,
    )
  } catch (error) {
    console.error('[sonom/storefront] Could not load categories', error)
    return []
  }
}

export async function getCategoriesWithCounts(): Promise<
  StoreCategoryWithCount[]
> {
  const categories = await getCategories()
  if (!categories.length) {
    return []
  }

  const counts = await getCategoryProductCounts()

  return categories.map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }))
}

async function getCategoryProductCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>()

  try {
    // Paginate defensively; the catalog is small and this keeps counts correct
    // if it grows past the Medusa default page size.
    for (let page = 0; page < 10; page += 1) {
      const offset = page * 100
      const data = await storeFetch<ProductListResponse>(
        `/store/products?limit=100&offset=${offset}&fields=id,categories.id`,
        { next: { revalidate: CATEGORY_REVALIDATE, tags: ['products'] } },
      )
      const products = data.products ?? []

      for (const product of products) {
        for (const category of product.categories ?? []) {
          counts.set(category.id, (counts.get(category.id) ?? 0) + 1)
        }
      }

      if (products.length < 100) {
        break
      }
    }
  } catch (error) {
    console.error('[sonom/storefront] Could not compute category counts', error)
  }

  return counts
}

export async function getCategoryByHandle(
  handle: string,
): Promise<StoreCategory | null> {
  try {
    const data = await storeFetch<CategoryListResponse>(
      `/store/product-categories?handle=${encodeURIComponent(handle)}&limit=1&fields=${CATEGORY_FIELDS}`,
      { next: { revalidate: CATEGORY_REVALIDATE, tags: ['categories'] } },
    )

    return data.product_categories?.[0] ?? null
  } catch (error) {
    console.error(`[sonom/storefront] Could not load category ${handle}`, error)
    return null
  }
}

export async function getProducts(
  options: { limit?: number; categoryId?: string; handle?: string } = {},
): Promise<StoreProduct[]> {
  try {
    const regionId = await getRegionId()
    const search = new URLSearchParams()
    search.set('limit', String(options.limit ?? 50))

    if (regionId) {
      search.set('region_id', regionId)
    }
    if (options.categoryId) {
      search.set('category_id', options.categoryId)
    }
    if (options.handle) {
      search.set('handle', options.handle)
    }

    const data = await storeFetch<ProductListResponse>(
      `/store/products?${search.toString()}`,
      { next: { revalidate: PRODUCT_REVALIDATE, tags: ['products'] } },
    )

    return data.products ?? []
  } catch (error) {
    console.error('[sonom/storefront] Could not load products', error)
    return []
  }
}

export async function getProductByHandle(
  handle: string,
): Promise<StoreProduct | null> {
  const products = await getProducts({ handle, limit: 1 })
  return products[0] ?? null
}
