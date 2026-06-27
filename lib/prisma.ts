import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? ''

  // prisma+postgres:// = Prisma Postgres / Accelerate endpoint (pooled.db.prisma.io).
  // These use Prisma's internal HTTP-based transport, not the PostgreSQL wire protocol,
  // so pg.Pool cannot connect to them.
  if (url.startsWith('prisma+postgres://')) {
    return new PrismaClient({ accelerateUrl: url })
  }

  // Standard PostgreSQL (e.g. a self-hosted DB or local dev server).
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
