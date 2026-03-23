import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureLessonProgressRows, getFlatCurriculum, neighbors } from '@/lib/course-curriculum'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, isPublished: true },
    })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (!course.isPublished) return NextResponse.json({ error: 'Course is not available' }, { status: 403 })

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: params.lessonId,
        subsection: { section: { courseId: params.id } },
      },
      include: {
        subsection: {
          include: { section: { select: { title: true } } },
        },
      },
    })
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    const enrolled =
      !!userId &&
      !!(await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: params.id } },
      }))

    const canAccess = lesson.isPreview || enrolled
    if (!canAccess) {
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.json({ error: 'Enroll to access this lesson' }, { status: 403 })
    }

    if (enrolled && userId) {
      await ensureLessonProgressRows(userId, params.id)
    }

    const flat = await getFlatCurriculum(params.id)
    const navFlat = enrolled ? flat : flat.filter((l) => l.isPreview)
    const { prevId, nextId, index } = neighbors(navFlat, lesson.id)

    let progress: { completed: boolean; progress: number } | null = null
    if (enrolled && userId) {
      const row = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        select: { completed: true, progress: true },
      })
      if (row) progress = { completed: row.completed, progress: row.progress }
    }

    return NextResponse.json({
      course: { id: course.id, title: course.title },
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        duration: lesson.duration,
        type: lesson.type,
        isPreview: lesson.isPreview,
        sectionTitle: lesson.subsection.section.title,
        subsectionTitle: lesson.subsection.title,
      },
      navigation: {
        lessonIndex: index,
        totalLessons: navFlat.length,
        prevLessonId: prevId,
        nextLessonId: nextId,
      },
      enrolled,
      progress,
    })
  } catch (error) {
    console.error('Error loading lesson:', error)
    return NextResponse.json({ error: 'Failed to load lesson' }, { status: 500 })
  }
}
