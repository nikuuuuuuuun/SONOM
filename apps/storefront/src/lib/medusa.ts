import Medusa from '@medusajs/js-sdk'
import { BACKEND_URL, PUBLISHABLE_KEY } from '@/lib/constants'

const sdk = new Medusa({
  baseUrl: BACKEND_URL,
  auth: {
    type: 'session',
  },
})

export function getMedusaClient() {
  return sdk
}

export async function getRegionId(): Promise<string | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return undefined
    const json = await res.json()
    return json.regions?.[0]?.id
  } catch {
    return undefined
  }
}