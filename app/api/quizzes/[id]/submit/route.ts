import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitSchema = z.object({
  answers: z.array(z.object({ questionId: z.string(), optionId: z.string() })),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validatedData = submitSchema.parse(body)

    const enrollment = await prisma.quizEnrollment.findUnique({
      where: { userId_quizId: { userId: session.user.id, quizId: params.id } },
      include: {
        quiz: {
          include: {
            sections: { include: { questions: { include: { options: true } } } },
          },
        },
      },
    })

    if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this quiz' }, { status: 403 })

    const questions = enrollment.quiz.sections.flatMap((s: any) => s.questions)

    let totalMarks = 0
    let score = 0
    const answerRecords = []
    const review = []

    for (const question of questions) {
      totalMarks += question.marks
      const userAnswer = validatedData.answers.find((a) => a.questionId === question.id)
      const isCorrect = userAnswer && question.correctOptionId ? userAnswer.optionId === question.correctOptionId : false
      const selectedOption = question.options.find((opt: any) => opt.id === userAnswer?.optionId)
      const correctOption = question.options.find((opt: any) => opt.id === question.correctOptionId)
      const marksObtained = isCorrect ? question.marks : 0
      score += marksObtained

      answerRecords.push({
        enrollmentId: enrollment.id,
        questionId: question.id,
        answer: selectedOption?.option || '',
        isCorrect,
        marksObtained,
      })

      review.push({
        sectionId: question.sectionId,
        sectionTitle: enrollment.quiz.sections.find((s: any) => s.id === question.sectionId)?.title || '',
        questionId: question.id,
        question: question.question,
        questionImageUrl: question.questionImageUrl || null,
        marks: question.marks,
        selectedOptionId: userAnswer?.optionId || null,
        correctOptionId: question.correctOptionId || null,
        options: question.options.map((opt: any) => ({
          id: opt.id,
          option: opt.option,
        })),
        selectedAnswer: selectedOption?.option || null,
        correctAnswer: correctOption?.option || null,
        isCorrect,
        marksObtained,
      })
    }

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
    const completedAt = new Date()

    const existingAttemptsCount = await prisma.quizAttempt.count({
      where: { enrollmentId: enrollment.id },
    })
    const nextAttemptNumber = existingAttemptsCount + 1
    const passed = percentage >= 50

    await prisma.$transaction([
      prisma.quizAnswer.deleteMany({ where: { enrollmentId: enrollment.id } }),
      prisma.quizAnswer.createMany({ data: answerRecords }),
      prisma.quizEnrollment.update({
        where: { id: enrollment.id },
        data: { completedAt, score, totalMarks, percentage },
      }),
      prisma.quizAttempt.create({
        data: {
          enrollmentId: enrollment.id,
          userId: session.user.id,
          quizId: params.id,
          attemptNumber: nextAttemptNumber,
          score,
          totalMarks,
          percentage,
          passed,
          review,
          submittedAt: completedAt,
        },
      }),
    ])

    const updatedEnrollment = await prisma.quizEnrollment.findUnique({
      where: { id: enrollment.id },
    })

    return NextResponse.json({
      enrollment: updatedEnrollment,
      attemptNumber: nextAttemptNumber,
      score,
      totalMarks,
      percentage,
      passed,
      review,
    })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    console.error('Error submitting quiz:', error)
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
  }
}
