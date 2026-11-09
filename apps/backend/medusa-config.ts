import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { SII_INVOICING_MODULE } from './src/modules/sii-invoicing/constants'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Loaded with require so the Zod validation runs *after* loadEnv() has populated process.env.
const { env } = require('./src/env') as typeof import('./src/env')

const isLocalDb = /localhost|127\.0\.0\.1|::1/.test(env.DATABASE_URL)
const useDbSsl = env.DB_SSL
  ? env.DB_SSL === 'true'
  : !isLocalDb

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: env.DATABASE_URL,
    databaseDriverOptions: {
      connection: {
        ssl: useDbSsl ? { rejectUnauthorized: false } : false,
      },
    },
    // Never enable query logging for tunnel/production traffic: it leaks PII and kills throughput.
    databaseLogging: env.DATABASE_LOGGING === 'true',
    http: {
      storeCors: env.STORE_CORS,
      adminCors: env.ADMIN_CORS,
      authCors: env.AUTH_CORS,
      jwtSecret: env.JWT_SECRET,
      cookieSecret: env.COOKIE_SECRET,
    },
    redisUrl: env.REDIS_URL,
  },
  admin: {
    disable: env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: env.ADMIN_BACKEND_URL,
  },
  plugins: [
    // Plugin storage S3 (Cloudflare R2) — activar tras crear bucket
    // { resolve: '@medusajs/file-s3', options: { s3_url: process.env.S3_URL, s3_credential: { access_key_id: process.env.S3_ACCESS_KEY, secret_access_key: process.env.S3_SECRET_KEY }, bucket: process.env.S3_BUCKET } },
  ],
  modules: {
    // Native SII boleta issuer (replaces the old n8n workflow).
    [SII_INVOICING_MODULE]: {
      resolve: './src/modules/sii-invoicing',
    },
    eventBus: {
      resolve: env.REDIS_URL
        ? '@medusajs/event-bus-redis'
        : '@medusajs/event-bus-local',
      options: env.REDIS_URL ? { redisUrl: env.REDIS_URL } : {},
    },
    payment: {
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/mercado-pago',
            id: 'mercado-pago',
            options: {
              accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
              webhookSecret: env.MERCADO_PAGO_WEBHOOK_SECRET,
              notificationUrl: env.MERCADO_PAGO_NOTIFICATION_URL,
              backUrl: env.STOREFRONT_URL,
              statementDescriptor: env.MERCADO_PAGO_STATEMENT_DESCRIPTOR,
            },
          },
        ],
      },
    },
  },
})
