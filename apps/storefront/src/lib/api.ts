import 'server-only'
import { cache } from 'react'
import {
  BACKEND_URL,
  CF_ACCESS_CLIENT_ID,
  CF_ACCESS_CLIENT_SECRET,
  PUBLISHABLE_KEY,
} from '@/lib/constants'

type NextFetchOptions = {
  revalidate?: number | false
  tags?: string[]
}

type StoreFetchOptions = Omit<RequestInit, 'next'> & {
  next?: NextFetchOptions
}

export class StoreApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string,
  ) {
    super(`Store API ${status} ${path}`)
    this.name = 'StoreApiError'
  }
}

/**
 * Single entry point for Medusa Store API calls.
 *
 * - Always sends `x-publishable-api-key`.
 * - Supports optional Cloudflare Access service tokens (tunnel deployments).
 * - Never exposes the backend URL or key to client components.
 */
export async function storeFetch<T>(
  path: string,
  options: StoreFetchOptions = {},
): Promise<T> {
  const { headers: initialHeaders, ...rest } = options
  const headers = new Headers(initialHeaders)

  headers.set('accept', 'application/json')
  if (PUBLISHABLE_KEY) {
    headers.set('x-publishable-api-key', PUBLISHABLE_KEY)
  }
  if (rest.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers.set('CF-Access-Client-Id', CF_ACCESS_CLIENT_ID)
    headers.set('CF-Access-Client-Secret', CF_ACCESS_CLIENT_SECRET)
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers,
  } as RequestInit)

  if (!response.ok) {
    const body = await response.text()
    throw new StoreApiError(response.status, body, path)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

type Region = {
  id: string
  currency_code: string
}

export const getRegionId = cache(async (): Promise<string | undefined> => {
  try {
    const data = await storeFetch<{ regions: Region[] }>(
      '/store/regions?limit=10&fields=id,currency_code',
      { next: { revalidate: 3_600, tags: ['regions'] } },
    )

    const regions = data.regions ?? []
    return (
      regions.find((region) => region.currency_code === 'clp')?.id ??
      regions[0]?.id
    )
  } catch (error) {
    console.error('[sonom/storefront] Could not resolve region', error)
    return undefined
  }
})
