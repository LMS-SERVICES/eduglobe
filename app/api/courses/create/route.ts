import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  descriptionFull: z.string().min(2, 'Full description is required'),
  thumbnail: z.string().url('Invalid thumbnail URL'),
  price: z.number().min(0, 'Price must be positive'),
  originalPrice: z.number().min(0).optional().nullable(),
  language: z.string().default('English'),
  timeline: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  whatYouWillLearn: z.array(z.string()).min(1, 'At least one learning point is required'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  isPublished: z.boolean().optional().default(true),
  sections: z.array(
    z.object({
      title: z.string().min(1, 'Section title is required'),
      order: z.number(),
      lessons: z.array(
        z.object({
          title: z.string().min(1, 'Lesson title is required'),
          description: z.string().optional(),
          content: z.string().optional(), // backward compatibility
          videoUrl: z.string().url('Invalid video URL').optional(),
          documentUrl: z.string().url('Invalid document URL').optional(),
          quizId: z.string().optional(),
          duration: z.string().optional(),
          type: z.enum(['video', 'document', 'quiz']),
          order: z.number(),
          isPreview: z.boolean().default(false),
        })
      ).min(1, 'Each section must have at least one lesson'),
    })
  ).min(1, 'At least one section is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    let instructor = await prisma.instructor.findFirst({
      where: { name: session.user.name || session.user.email || 'Unknown' },
    })

    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: {
          name: session.user.name || session.user.email || 'Unknown',
          bio: 'Instructor at EduGlobe Academy',
          image: session.user.image || null,
        },
      })
    }

    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const existingCourse = await prisma.course.findUnique({ where: { slug } })
    const finalSlug = existingCourse ? `${slug}-${Date.now()}` : slug

    const totalLessons = validatedData.sections.reduce(
      (sum, section) => sum + section.lessons.length,
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
      return total + section.lessons.reduce((sectionTotal, lesson) => {
        return lesson.type === 'video'
          ? sectionTotal + parseDuration(lesson.duration || '0:00')
          : sectionTotal
      }, 0)
    }, 0)

    // Type-specific lesson validation
    for (const section of validatedData.sections) {
      for (const lesson of section.lessons) {
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

    const hours = Math.floor(totalDurationSeconds / 3600)
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60)
    const courseDuration = hours > 0
      ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`

    const course = await prisma.course.create({
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
        instructorId: instructor.id,
        categoryId: validatedData.categoryId,
        isPublished: validatedData.isPublished,
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
            lessons: {
              create: section.lessons.map((lesson) => ({
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
        rating: {
          create: {
            averageRating: 0,
            totalReviews: 0,
          },
        },
      },
      include: {
        instructor: true,
        category: true,
        sections: { include: { lessons: true } },
        whatYouWillLearn: true,
        requirements: true,
        rating: true,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
