import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return !!session?.user?.id && session.user.role === 'ADMIN'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizzes = await prisma.quiz.findMany({
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

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching admin quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const quiz = await prisma.$transaction(
      async (tx) => {
        const newQuiz = await tx.quiz.create({
          data: {
            title: body.title,
            description: body.description,
            details: body.details,
            thumbnail: body.thumbnail,
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
            price: body.price,
            generateCertificate: body.generateCertificate,
            isPublished: body.isPublished,
          },
        })

        const createdSections = await Promise.all(
          body.sections.map(async (section: any) => {
            const newSection = await tx.quizSection.create({
              data: { quizId: newQuiz.id, title: section.title, order: section.order },
            })

            const requireCorrectAnswer = body.isPublished === true

            const createdQuestions = await Promise.all(
              section.questions.map(async (q: any) => {
                const correctOptionIndex = q.options.findIndex(
                  (opt: any) => opt.id === q.correctOptionId || opt.order.toString() === q.correctOptionId
                )

                if (requireCorrectAnswer && correctOptionIndex === -1) {
                  throw new Error(`Correct option not found for question: ${q.question}`)
                }

                const question = await tx.quizQuestion.create({
                  data: {
                    sectionId: newSection.id,
                    question: q.question,
                    questionImageUrl: q.questionImageUrl || null,
                    marks: q.marks,
                    order: q.order,
                    options: {
                      create: q.options.map((opt: any) => ({
                        option: opt.option,
                        imageUrl: opt.imageUrl || null,
                        order: opt.order,
                      })),
                    },
                  },
                  include: { options: true },
                })

                if (correctOptionIndex === -1) {
                  return question
                }

                const correctOption = question.options[correctOptionIndex]
                if (!correctOption) {
                  if (requireCorrectAnswer) {
                    throw new Error(`Correct option not found for question: ${q.question}`)
                  }
                  return question
                }

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
    console.error('Error creating admin quiz:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
