import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureLessonProgressRows } from '@/lib/course-curriculum'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, isPublished: true },
    })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (!course.isPublished) return NextResponse.json({ error: 'Course is not available' }, { status: 403 })

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: params.id } },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
    }

    await ensureLessonProgressRows(session.user.id, params.id)

    const progressRows = await prisma.lessonProgress.findMany({
      where: { enrollmentId: enrollment.id },
      select: { lessonId: true, completed: true, progress: true },
    })
    const byLesson = new Map(progressRows.map((p) => [p.lessonId, p]))

    const sectionsData = await prisma.section.findMany({
      where: { courseId: params.id },
      orderBy: { order: 'asc' },
      include: {
        subsections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, type: true } },
          },
        },
      },
    })

    const lessons: {
      id: string
      title: string
      sectionTitle: string
      subsectionTitle: string
      completed: boolean
      progress: number
    }[] = []

    const curriculum = {
      sections: sectionsData.map((section) => ({
        id: section.id,
        title: section.title,
        subsections: section.subsections.map((sub) => ({
          id: sub.id,
          title: sub.title,
          lessons: sub.lessons.map((lesson) => {
            const p = byLesson.get(lesson.id)
            const completed = p?.completed ?? false
            const progress = p?.progress ?? 0
            lessons.push({
              id: lesson.id,
              title: lesson.title,
              sectionTitle: section.title,
              subsectionTitle: sub.title,
              completed,
              progress,
            })
            return {
              id: lesson.id,
              title: lesson.title,
              type: lesson.type,
              completed,
              progress,
            }
          }),
        })),
      })),
    }

    const firstIncomplete = lessons.find((l) => !l.completed)
    const continueLessonId = firstIncomplete?.id ?? lessons[0]?.id ?? null

    return NextResponse.json({
      course: { id: course.id, title: course.title },
      lessons,
      curriculum,
      continueLessonId,
      totalLessons: lessons.length,
      completedCount: lessons.filter((l) => l.completed).length,
    })
  } catch (error) {
    console.error('Error loading learn state:', error)
    return NextResponse.json({ error: 'Failed to load learn state' }, { status: 500 })
  }
}
