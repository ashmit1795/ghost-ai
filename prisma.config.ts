import path from 'node:path'
import { defineConfig } from 'prisma/config'
import 'dotenv/config'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is missing')
}

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma'),
  datasource: {
    url: dbUrl,
  },
})
