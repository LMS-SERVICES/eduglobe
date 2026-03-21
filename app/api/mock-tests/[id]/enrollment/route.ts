import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const enrollment = await prisma.mockTestEnrollment.findUnique({
      where: { userId_mockTestId: { userId: session.user.id, mockTestId: params.id } },
    })
    if (!enrollment) return NextResponse.json({ enrolled: false })

    const latestAttempt = await prisma.mockTestAttempt.findFirst({
      where: { enrollmentId: enrollment.id },
      orderBy: { attemptNumber: 'desc' },
      select: {
        attemptNumber: true,
        score: true,
        totalMarks: true,
        percentage: true,
        passed: true,
        review: true,
      },
    })

    return NextResponse.json({
      enrolled: true,
      enrollment: { id: enrollment.id, enrolledAt: enrollment.enrolledAt },
      latestAttempt: latestAttempt || null,
    })
  } catch (error) {
    console.error('Error checking mock enrollment:', error)
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 })
  }
}
