import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasQuizAccessViaCourseEnrollment } from '@/lib/quiz-course-access'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const quiz = await prisma.quiz.findUnique({ where: { id: params.id } })
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (!quiz.isPublished) return NextResponse.json({ error: 'Quiz is not available' }, { status: 403 })

    const existingEnrollment = await prisma.quizEnrollment.findUnique({
      where: { userId_quizId: { userId: session.user.id, quizId: params.id } },
    })
    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled', enrollment: existingEnrollment }, { status: 400 })
    }

    if (quiz.price > 0) {
      const viaCourse = await hasQuizAccessViaCourseEnrollment(session.user.id, params.id)
      if (!viaCourse) {
        return NextResponse.json({ error: 'Payment required for this quiz' }, { status: 402 })
      }
    }

    const enrollment = await prisma.quizEnrollment.create({
      data: { userId: session.user.id, quizId: params.id },
      include: {
        quiz: {
          include: {
            sections: {
              include: { questions: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    enrollment.quiz.sections.forEach((section: any) => {
      section.questions.forEach((question: any) => { delete question.correctOptionId })
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('Error enrolling in quiz:', error)
    return NextResponse.json({ error: 'Failed to enroll in quiz' }, { status: 500 })
  }
}
