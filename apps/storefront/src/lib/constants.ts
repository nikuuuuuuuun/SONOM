export const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'cl'

// Prefer the server-only variable so the tunnel URL is never inlined into the client bundle.
export const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  'http://localhost:9000'

export const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

export const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

export const MERCADO_PAGO_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || ''

// Optional Cloudflare Access service token for server-to-server calls.
export const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || ''
export const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || ''

export const CART_COOKIE = 'cart_id'
export const AUTH_COOKIE = 'medusa_auth_token'
