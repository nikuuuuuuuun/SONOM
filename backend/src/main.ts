import express from "express"
import { Medusa } from "@medusajs/medusa"

async function bootstrap() {
  const app = express()

  const { ctrl } = await Medusa.start({
    app,
    directory: __dirname,
    expressSession: {
      resave: false,
      saveUninitialized: true,
      secret: process.env.COOKIE_SECRET || "supersecret",
    },
  })

  const PORT = process.env.PORT || 9000
  app.listen(PORT, () => {
    console.log(`Sonom backend server is running on port ${PORT}`)
  })
}

bootstrap()
