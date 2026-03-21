import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const quizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  details: z.string().optional(),
  thumbnail: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  price: z.number().min(0).default(0),
  generateCertificate: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      order: z.number(),
      questions: z.array(
        z.object({
          question: z.string().min(1),
          correctOptionId: z.string().min(1),
          marks: z.number().min(1).default(1),
          order: z.number().default(0),
          options: z.array(
            z.object({
              id: z.string().optional(),
              option: z.string().min(1),
              order: z.number().default(0),
            })
          ).min(2),
        })
      ).min(1),
    })
  ).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const where: any = {}
    if (!isAdmin) where.isPublished = true

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        sections: {
          include: {
            questions: {
              include: { options: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!isAdmin) {
      quizzes.forEach((quiz) => {
        quiz.sections.forEach((section: any) => {
          section.questions.forEach((question: any) => {
            delete question.correctOptionId
          })
        })
      })
    }

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = quizSchema.parse(body)

    const quiz = await prisma.$transaction(
      async (tx) => {
        const newQuiz = await tx.quiz.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            details: validatedData.details,
            thumbnail: validatedData.thumbnail,
            expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
            price: validatedData.price,
            generateCertificate: validatedData.generateCertificate,
            isPublished: validatedData.isPublished,
          },
        })

        const createdSections = await Promise.all(
          validatedData.sections.map(async (section) => {
            const newSection = await tx.quizSection.create({
              data: { quizId: newQuiz.id, title: section.title, order: section.order },
            })

            const createdQuestions = await Promise.all(
              section.questions.map(async (q) => {
                const correctOptionIndex = q.options.findIndex(
                  (opt) => opt.id === q.correctOptionId || opt.order.toString() === q.correctOptionId
                )
                if (correctOptionIndex === -1) throw new Error(`Correct option not found for: ${q.question}`)

                const question = await tx.quizQuestion.create({
                  data: {
                    sectionId: newSection.id,
                    question: q.question,
                    marks: q.marks,
                    order: q.order,
                    options: { create: q.options.map((opt) => ({ option: opt.option, order: opt.order })) },
                  },
                  include: { options: true },
                })

                const correctOption = question.options[correctOptionIndex]
                if (!correctOption) throw new Error('Correct option not found after creation')

                return tx.quizQuestion.update({
                  where: { id: question.id },
                  data: { correctOptionId: correctOption.id },
                  include: { options: true },
                })
              })
            )

            return { ...newSection, questions: createdQuestions }
          })
        )

        return { ...newQuiz, sections: createdSections }
      },
      { timeout: 120000 }
    )

    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
