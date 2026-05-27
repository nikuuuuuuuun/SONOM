const dotenv = require("dotenv")

let ENV_FILE_NAME = ""
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production"
    break
  case "staging":
    ENV_FILE_NAME = ".env.staging"
    break
  case "test":
    ENV_FILE_NAME = ".env.test"
    break
  default:
    ENV_FILE_NAME = ".env"
    break
}

dotenv.config({ path: ENV_FILE_NAME })

const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001"
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000"
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost:5432/sonom"
const REDIS_URL = process.env.REDIS_URL || ""

const plugins = [
  {
    resolve: "@medusajs/event-bus-local",
  },
  {
    resolve: "@medusajs/file-local",
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/fulfillment-manual",
  },
  {
    resolve: "medusa-payment-manual",
  },
]

const modules = {
  eventBus: {
    resolve: "@medusajs/event-bus-local",
  },
  fileService: {
    resolve: "@medusajs/file-local",
  },
}

module.exports = {
  projectConfig: {
    redisUrl: REDIS_URL,
    databaseUrl: DATABASE_URL,
    databaseType: "postgres",
    storeCors: STORE_CORS,
    adminCors: ADMIN_CORS,
  },
  plugins,
  modules,
}
