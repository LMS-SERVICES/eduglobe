import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureLessonProgressRows } from '@/lib/course-curriculum'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: params.id } },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: params.lessonId,
        subsection: { section: { courseId: params.id } },
      },
    })
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    await ensureLessonProgressRows(session.user.id, params.id)

    const body = await request.json().catch(() => ({}))
    const completed = typeof body.completed === 'boolean' ? body.completed : undefined
    const progressPct = typeof body.progress === 'number' ? Math.min(100, Math.max(0, body.progress)) : undefined

    const updated = await prisma.lessonProgress.update({
      where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
      data: {
        ...(completed !== undefined ? { completed, completedAt: completed ? new Date() : null } : {}),
        ...(progressPct !== undefined ? { progress: progressPct } : {}),
      },
    })

    return NextResponse.json({
      completed: updated.completed,
      progress: updated.progress,
      completedAt: updated.completedAt,
    })
  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
