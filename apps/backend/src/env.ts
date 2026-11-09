import { z } from 'zod'

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalUrl = optionalString

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DB_SSL: z.enum(['true', 'false']).optional(),
    DATABASE_LOGGING: z.enum(['true', 'false']).optional(),

    STORE_CORS: z.string().trim().default('http://localhost:8000'),
    ADMIN_CORS: z.string().trim().default('http://localhost:5173,http://localhost:9000'),
    AUTH_CORS: z.string().trim().optional(),
    JWT_SECRET: z.string().min(1).optional(),
    COOKIE_SECRET: z.string().min(1).optional(),

    REDIS_URL: optionalUrl,
    DISABLE_MEDUSA_ADMIN: z.enum(['true', 'false']).default('false'),
    ADMIN_BACKEND_URL: z.string().url().default('http://localhost:9000'),

    STOREFRONT_URL: z.string().url().default('http://localhost:8000'),

    MERCADO_PAGO_PUBLIC_KEY: optionalString,
    MERCADO_PAGO_ACCESS_TOKEN: optionalString,
    MERCADO_PAGO_WEBHOOK_SECRET: optionalString,
    MERCADO_PAGO_NOTIFICATION_URL: optionalString,
    MERCADO_PAGO_STATEMENT_DESCRIPTOR: optionalString,

    // --- Native SII boleta issuer (replaces n8n) ---
    SII_ENABLED: optionalString,
    SII_API_URL: optionalString,
    SII_API_KEY: optionalString,
    SII_API_KEY_HEADER: optionalString,
    SII_API_KEY_PREFIX: optionalString,
    SII_IDEMPOTENCY_HEADER: optionalString,
    SII_API_TIMEOUT_MS: optionalString,
    SII_API_MAX_ATTEMPTS: optionalString,
    SII_DTE_TYPE: optionalString,

    SII_EMISOR_RUT: optionalString,
    SII_EMISOR_RAZON_SOCIAL: optionalString,
    SII_EMISOR_GIRO: optionalString,
    SII_EMISOR_ACTIVIDAD_ECONOMICA: optionalString,
    SII_EMISOR_DIRECCION: optionalString,
    SII_EMISOR_COMUNA: optionalString,
    SII_EMISOR_CIUDAD: optionalString,
    SII_EMISOR_TELEFONO: optionalString,
    SII_EMISOR_EMAIL: optionalString,

    SII_PRICES_INCLUDE_TAX: optionalString,
    SII_IVA_RATE: optionalString,
    SII_CONSUMIDOR_FINAL_RUT: optionalString,
    SII_BOLETA_URL_TEMPLATE: optionalString,

    UPLOAD_DIR: optionalString,
  })
  .superRefine((value, ctx) => {
    const isProduction = value.NODE_ENV === 'production'

    if (isProduction) {
      const secrets: Array<[keyof typeof value, string]> = [
        ['JWT_SECRET', 'JWT_SECRET must be set to a strong, unique value in production'],
        ['COOKIE_SECRET', 'COOKIE_SECRET must be set to a strong, unique value in production'],
      ]

      for (const [key, message] of secrets) {
        const secret = value[key]
        if (!secret || secret === 'supersecret' || secret.startsWith('change-this')) {
          ctx.addIssue({ code: 'custom', path: [key], message })
        } else if (secret.length < 32) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} must be at least 32 characters long in production`,
          })
        }
      }

      if (!value.MERCADO_PAGO_ACCESS_TOKEN) {
        ctx.addIssue({
          code: 'custom',
          path: ['MERCADO_PAGO_ACCESS_TOKEN'],
          message: 'MERCADO_PAGO_ACCESS_TOKEN is required in production',
        })
      }

      if (!value.MERCADO_PAGO_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['MERCADO_PAGO_WEBHOOK_SECRET'],
          message: 'MERCADO_PAGO_WEBHOOK_SECRET is required in production (Mercado Pago webhook signing secret)',
        })
      }

      if (!value.MERCADO_PAGO_NOTIFICATION_URL?.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['MERCADO_PAGO_NOTIFICATION_URL'],
          message: 'MERCADO_PAGO_NOTIFICATION_URL must be a public HTTPS URL in production',
        })
      }

      if (!value.STOREFRONT_URL.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['STOREFRONT_URL'],
          message: 'STOREFRONT_URL must be a public HTTPS URL in production',
        })
      }

      // Native SII invoicing is the only boleta path: fail fast if it is enabled
      // but the issuer or the API credentials are missing.
      // "manual" means boletas are issued by hand through SII's e-Boleta app:
      // no HTTP calls, no provider credentials required.
      const manualMode = value.SII_API_URL?.toLowerCase() === 'manual'

      if (value.SII_ENABLED !== 'false' && !manualMode) {
        const requiredSii: Array<[keyof typeof value, string]> = [
          ['SII_API_URL', 'SII_API_URL is required to issue boletas in production'],
          ['SII_API_KEY', 'SII_API_KEY is required to issue boletas in production'],
          ['SII_EMISOR_RUT', 'SII_EMISOR_RUT is required in production'],
          ['SII_EMISOR_RAZON_SOCIAL', 'SII_EMISOR_RAZON_SOCIAL is required in production'],
          ['SII_EMISOR_GIRO', 'SII_EMISOR_GIRO is required in production'],
          ['SII_EMISOR_DIRECCION', 'SII_EMISOR_DIRECCION is required in production'],
          ['SII_EMISOR_COMUNA', 'SII_EMISOR_COMUNA is required in production'],
          ['SII_EMISOR_CIUDAD', 'SII_EMISOR_CIUDAD is required in production'],
        ]

        for (const [key, message] of requiredSii) {
          if (!value[key]) {
            ctx.addIssue({ code: 'custom', path: [key], message })
          }
        }

        if (value.SII_API_URL && value.SII_API_URL !== 'manual' && !value.SII_API_URL.startsWith('https://')) {
          ctx.addIssue({
            code: 'custom',
            path: ['SII_API_URL'],
            message: 'SII_API_URL must be a public HTTPS URL in production',
          })
        }
      }
    }
  })

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n')

  throw new Error(`[sonom/backend] Invalid environment configuration:\n${details}`)
}

const raw = parsed.data

export const env = {
  ...raw,
  AUTH_CORS: raw.AUTH_CORS || raw.ADMIN_CORS,
  JWT_SECRET:
    raw.JWT_SECRET || (raw.NODE_ENV === 'development' ? 'supersecret' : ''),
  COOKIE_SECRET:
    raw.COOKIE_SECRET || (raw.NODE_ENV === 'development' ? 'supersecret' : ''),
}

export const isProduction = env.NODE_ENV === 'production'
