import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonIfDatabaseUnavailable } from '@/lib/prisma-route-errors'

export async function GET() {
  try {
    const tests = await prisma.mockTest.findMany({
      where: { isPublished: true },
      include: {
        sections: { include: { questions: true } },
        _count: { select: { enrollments: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tests)
  } catch (error) {
    const unavailable = jsonIfDatabaseUnavailable(error)
    if (unavailable) return unavailable
    console.error('Error fetching mock tests:', error)
    return NextResponse.json({ error: 'Failed to fetch mock tests' }, { status: 500 })
  }
}
