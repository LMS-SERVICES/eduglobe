import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/** User-facing copy when Postgres/Neon cannot be reached (same for all API routes). */
export const DATABASE_UNAVAILABLE_MESSAGE =
  'Database is unreachable. In Neon: open the dashboard, resume the project, confirm DATABASE_URL in .env, then restart npm run dev.'

/**
 * If Prisma failed to connect, return a 503 JSON response. Otherwise return null.
 * Use in API route catch blocks so the UI gets a clear message instead of a generic 500.
 */
export function jsonIfDatabaseUnavailable(error: unknown): NextResponse | null {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json({ error: DATABASE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }
  return null
}
