import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'

/**
 * JWT sessions can outlive DB rows (reset DB, deleted user, different DATABASE_URL).
 * Use this before writes that FK to users.id to avoid P2003 and return a clear 401.
 */
export async function resolveSessionUserId(
  session: Session | null
): Promise<{ userId: string } | { error: string; status: number }> {
  const id = session?.user?.id
  if (!id) return { error: 'Unauthorized', status: 401 }
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) {
    return {
      error: 'Session is out of date. Please sign out and sign in again.',
      status: 401,
    }
  }
  return { userId: user.id }
}
