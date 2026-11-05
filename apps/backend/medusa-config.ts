import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const dbUrl = process.env.DATABASE_URL || ''
const isLocalDb = /localhost|127\.0\.0\.1|::1/.test(dbUrl)
const useDbSsl = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalDb)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      connection: {
        ssl: useDbSsl ? { rejectUnauthorized: false } : false,
      },
    },
    databaseLogging: process.env.NODE_ENV === 'development',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS || process.env.ADMIN_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
    redisUrl: process.env.REDIS_URL,
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
    backendUrl: process.env.ADMIN_BACKEND_URL || 'http://localhost:9000',
  },
  plugins: [
    // Plugin storage S3 (Cloudflare R2) — activar tras crear bucket
    // { resolve: '@medusajs/file-s3', options: { s3_url: process.env.S3_URL, s3_credential: { access_key_id: process.env.S3_ACCESS_KEY, secret_access_key: process.env.S3_SECRET_KEY }, bucket: process.env.S3_BUCKET } },
  ],
  modules: {
    eventBus: {
      resolve: process.env.REDIS_URL
        ? '@medusajs/event-bus-redis'
        : '@medusajs/event-bus-local',
      options: process.env.REDIS_URL
        ? { redisUrl: process.env.REDIS_URL }
        : {},
    },
    payment: {
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/mercado-pago',
            id: 'mercado-pago',
            options: { accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN },
          },
        ],
      },
    },
  },
})