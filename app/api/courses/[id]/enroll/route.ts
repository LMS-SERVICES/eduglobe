import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const course = await prisma.course.findUnique({ where: { id: params.id } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (!course.isPublished) return NextResponse.json({ error: 'Course is not available' }, { status: 403 })

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: params.id } },
    })
    if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })

    if (course.price > 0) {
      return NextResponse.json({ error: 'Payment required for this course' }, { status: 402 })
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: session.user.id, courseId: params.id },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 })
  }
}
