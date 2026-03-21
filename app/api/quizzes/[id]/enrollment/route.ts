import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const enrollment = await prisma.quizEnrollment.findUnique({
      where: { userId_quizId: { userId: session.user.id, quizId: params.id } },
      include: { quiz: { select: { id: true, title: true, isPublished: true } } },
    })

    if (!enrollment) return NextResponse.json({ enrolled: false })

    return NextResponse.json({
      enrolled: true,
      enrollment: {
        id: enrollment.id,
        completedAt: enrollment.completedAt,
        score: enrollment.score,
        totalMarks: enrollment.totalMarks,
        percentage: enrollment.percentage,
        certificate: enrollment.certificate,
      },
    })
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 })
  }
}
