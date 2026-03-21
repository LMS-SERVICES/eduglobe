import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const enrollment = await prisma.quizEnrollment.findUnique({
      where: { userId_quizId: { userId: session.user.id, quizId: params.id } },
      select: { id: true },
    })

    if (!enrollment) return NextResponse.json({ attempts: [] })

    const attempts = await prisma.quizAttempt.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { attemptNumber: 'desc' },
      select: {
        id: true,
        attemptNumber: true,
        score: true,
        totalMarks: true,
        percentage: true,
        passed: true,
        submittedAt: true,
      },
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
  }
}
