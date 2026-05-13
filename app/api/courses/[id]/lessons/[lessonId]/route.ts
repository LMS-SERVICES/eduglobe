import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureLessonProgressRows, getFlatCurriculum, neighbors } from '@/lib/course-curriculum'
import { extractS3KeyFromUrl, presignGetObjectUrl } from '@/lib/s3-helper'

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

    let resolvedContent = lesson.content
    // If lesson content points to an S3 object URL (or we stored a key), return a fresh presigned URL.
    // This keeps private buckets usable without storing expiring URLs in DB.
    if (lesson.content && (lesson.type === 'video' || lesson.type === 'document')) {
      const raw = lesson.content.trim()
      const key =
        raw.startsWith('http://') || raw.startsWith('https://')
          ? extractS3KeyFromUrl(raw)
          : raw.includes('/') && !raw.includes(' ') // likely "videos/<uuid>.mp4" etc.
            ? raw
            : null
      if (key) {
        const expiresInSeconds = lesson.type === 'video' ? 3 * 60 * 60 : 7 * 24 * 60 * 60
        try {
          resolvedContent = await presignGetObjectUrl({ key, expiresInSeconds })
        } catch {
          // fall back to stored value
          resolvedContent = lesson.content
        }
      }
    }

    return NextResponse.json({
      course: { id: course.id, title: course.title },
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: resolvedContent,
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
