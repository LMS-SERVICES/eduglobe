import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const emptyToUndef = (v: unknown) => {
  if (v === null || v === undefined) return undefined
  if (typeof v === 'string' && v.trim() === '') return undefined
  return typeof v === 'string' ? v.trim() : v
}

const optionalUrl = z.preprocess(emptyToUndef, z.string().url().optional())

/** Matches POST /api/courses/create so the admin wizard can reuse the same payload. */
const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  descriptionFull: z.string().min(2),
  thumbnail: z.string().url(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional().nullable(),
  language: z.string().default('English'),
  timeline: z.string().optional(),
  categoryId: z.string().min(1),
  whatYouWillLearn: z.array(z.string()).min(1),
  requirements: z.array(z.string()).min(1),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      order: z.number(),
      subsections: z.array(
        z.object({
          title: z.string().min(1),
          order: z.number(),
          lessons: z.array(
            z.object({
              title: z.string().min(1),
              description: z.string().optional(),
              content: z.string().optional(),
              videoUrl: optionalUrl,
              documentUrl: optionalUrl,
              quizId: z.preprocess(emptyToUndef, z.string().optional()),
              duration: z.string().optional(),
              type: z.enum(['video', 'document', 'quiz']),
              order: z.number(),
              isPreview: z.boolean().default(false),
            })
          ).min(1),
        })
      ).min(1),
    })
  ).min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        instructor: true,
        category: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
              include: { lessons: { orderBy: { order: 'asc' } } },
            },
          },
        },
        whatYouWillLearn: true,
        requirements: true,
        rating: true,
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    const existingCourse = await prisma.course.findUnique({ where: { id: params.id } })
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    let finalSlug = existingCourse.slug
    if (slug !== existingCourse.slug) {
      const slugExists = await prisma.course.findUnique({ where: { slug } })
      finalSlug = slugExists && slugExists.id !== params.id ? `${slug}-${Date.now()}` : slug
    }

    const totalLessons = validatedData.sections.reduce(
      (sum, section) =>
        sum + section.subsections.reduce((subSum, sub) => subSum + sub.lessons.length, 0),
      0
    )

    const parseDuration = (duration: string): number => {
      if (!duration) return 0
      const parts = duration.split(':').map(Number)
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      return 0
    }

    const totalDurationSeconds = validatedData.sections.reduce((total, section) => {
      return (
        total +
        section.subsections.reduce(
          (subTotal, sub) =>
            subTotal +
            sub.lessons.reduce((sectionTotal, lesson) => {
              return lesson.type === 'video'
                ? sectionTotal + parseDuration(lesson.duration || '0:00')
                : sectionTotal
            }, 0),
          0
        )
      )
    }, 0)

    for (const section of validatedData.sections) {
      for (const sub of section.subsections) {
        for (const lesson of sub.lessons) {
          if (lesson.type === 'video' && !lesson.videoUrl) {
            return NextResponse.json(
              { error: `Video URL is required for lesson "${lesson.title}"` },
              { status: 400 }
            )
          }
          if (lesson.type === 'document' && !lesson.documentUrl) {
            return NextResponse.json(
              { error: `Document URL is required for lesson "${lesson.title}"` },
              { status: 400 }
            )
          }
          if (lesson.type === 'quiz' && !lesson.quizId) {
            return NextResponse.json(
              { error: `Quiz selection is required for lesson "${lesson.title}"` },
              { status: 400 }
            )
          }
        }
      }
    }

    const hours = Math.floor(totalDurationSeconds / 3600)
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60)
    const courseDuration =
      hours > 0
        ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`

    await prisma.courseLearningPoint.deleteMany({ where: { courseId: params.id } })
    await prisma.courseRequirement.deleteMany({ where: { courseId: params.id } })
    await prisma.section.deleteMany({ where: { courseId: params.id } })

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        slug: finalSlug,
        description: validatedData.description,
        descriptionFull: validatedData.descriptionFull,
        thumbnail: validatedData.thumbnail,
        price: validatedData.price,
        originalPrice: validatedData.originalPrice,
        language: validatedData.language,
        duration: courseDuration || `${totalLessons} lessons`,
        timeline: validatedData.timeline,
        lecturesCount: totalLessons,
        categoryId: validatedData.categoryId,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        keywords: validatedData.keywords || null,
        whatYouWillLearn: {
          create: validatedData.whatYouWillLearn.map((content) => ({ content })),
        },
        requirements: {
          create: validatedData.requirements.map((content) => ({ content })),
        },
        sections: {
          create: validatedData.sections.map((section) => ({
            title: section.title,
            order: section.order,
            subsections: {
              create: section.subsections.map((sub) => ({
                title: sub.title,
                order: sub.order,
                lessons: {
                  create: sub.lessons.map((lesson) => ({
                    title: lesson.title,
                    description: lesson.description,
                    content:
                      lesson.type === 'video'
                        ? lesson.videoUrl || lesson.content || null
                        : lesson.type === 'document'
                          ? lesson.documentUrl || lesson.content || null
                          : lesson.quizId || lesson.content || null,
                    duration: lesson.duration || '0:00',
                    type: lesson.type,
                    order: lesson.order,
                    isPreview: lesson.isPreview,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        instructor: true,
        category: true,
        sections: { include: { subsections: { include: { lessons: true } } } },
        whatYouWillLearn: true,
        requirements: true,
        rating: true,
      },
    })

    return NextResponse.json(course)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const course = await prisma.course.update({
      where: { id: params.id },
      data: { isPublished: body.isPublished },
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.course.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
