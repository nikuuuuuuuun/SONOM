import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: process.env.NODE_ENV === 'development',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
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
    {
      resolve: '@medusajs/file-local',
      options: {
        upload_dir: 'uploads',
      },
    },
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
    fileService: {
      resolve: '@medusajs/file-local',
      options: {
        upload_dir: 'uploads',
      },
    },
  },
})
