import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ enrolled: false })

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: params.id } },
    })

    if (!enrollment) return NextResponse.json({ enrolled: false })
    return NextResponse.json({ enrolled: true, enrollment: { id: enrollment.id, enrolledAt: enrollment.enrolledAt } })
  } catch (error) {
    console.error('Error checking course enrollment:', error)
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 })
  }
}
