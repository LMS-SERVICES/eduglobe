import { prisma } from '@/lib/prisma'

export type FlatLesson = {
  id: string
  title: string
  sectionId: string
  sectionTitle: string
  subsectionId: string
  subsectionTitle: string
  order: number
  isPreview: boolean
}

/**
 * All lessons in display order: section order → subsection order → lesson order.
 */
export async function getFlatCurriculum(courseId: string): Promise<FlatLesson[]> {
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      subsections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  const flat: FlatLesson[] = []
  for (const section of sections) {
    for (const sub of section.subsections) {
      for (const lesson of sub.lessons) {
        flat.push({
          id: lesson.id,
          title: lesson.title,
          sectionId: section.id,
          sectionTitle: section.title,
          subsectionId: sub.id,
          subsectionTitle: sub.title,
          order: flat.length,
          isPreview: lesson.isPreview,
        })
      }
    }
  }
  return flat
}

export function neighbors(flat: FlatLesson[], lessonId: string) {
  const i = flat.findIndex((l) => l.id === lessonId)
  if (i < 0) return { prevId: null as string | null, nextId: null as string | null, index: -1 }
  return {
    prevId: i > 0 ? flat[i - 1].id : null,
    nextId: i < flat.length - 1 ? flat[i + 1].id : null,
    index: i,
  }
}

/**
 * Create missing LessonProgress rows for this enrollment so profile stats match the syllabus.
 */
export async function ensureLessonProgressRows(userId: string, courseId: string): Promise<string | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  })
  if (!enrollment) return null

  const flat = await getFlatCurriculum(courseId)
  if (flat.length === 0) return enrollment.id

  const existing = await prisma.lessonProgress.findMany({
    where: { enrollmentId: enrollment.id },
    select: { lessonId: true },
  })
  const have = new Set(existing.map((e) => e.lessonId))
  const missing = flat.filter((l) => !have.has(l.id))
  if (missing.length > 0) {
    await prisma.lessonProgress.createMany({
      data: missing.map((l) => ({
        userId,
        lessonId: l.id,
        enrollmentId: enrollment.id,
        completed: false,
        progress: 0,
      })),
      skipDuplicates: true,
    })
  }
  return enrollment.id
}
