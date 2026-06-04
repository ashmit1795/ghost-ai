import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL || ''

let prismaInstance: PrismaClient

if (dbUrl.startsWith('prisma+postgres://')) {
  // Use Accelerate
  prismaInstance = new PrismaClient({
    accelerateUrl: dbUrl,
  }).$extends(withAccelerate()) as unknown as PrismaClient
} else {
  // Use direct PG driver adapter
  const pool = new pg.Pool({
    connectionString: dbUrl,
  })
  const adapter = new PrismaPg(pool)
  prismaInstance = new PrismaClient({ adapter })
}

export const prisma = (globalForPrisma.prisma ?? prismaInstance) as PrismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
