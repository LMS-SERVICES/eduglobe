import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitSchema = z.object({
  answers: z.array(z.object({ questionId: z.string(), optionId: z.string().nullable().optional() })),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = submitSchema.parse(body)

    const enrollment = await prisma.mockTestEnrollment.findUnique({
      where: { userId_mockTestId: { userId: session.user.id, mockTestId: params.id } },
    })
    if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this mock test' }, { status: 403 })

    const mockTest = await prisma.mockTest.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: {
            questions: { include: { options: true } },
          },
        },
      },
    })
    if (!mockTest) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })

    const questions = mockTest.sections.flatMap((s: any) => s.questions)
    let totalMarks = 0
    let score = 0
    const answerRows: any[] = []
    const review: any[] = []

    for (const q of questions) {
      totalMarks += q.marks
      const userAnswer = validated.answers.find((a) => a.questionId === q.id)
      const selected = q.options.find((o: any) => o.id === userAnswer?.optionId)
      const correct = q.options.find((o: any) => o.id === q.correctOptionId)
      const isCorrect = !!(userAnswer?.optionId && q.correctOptionId && userAnswer.optionId === q.correctOptionId)
      const marksObtained = isCorrect ? q.marks : userAnswer?.optionId ? -Math.abs(q.negativeMarks || 0) : 0
      score += marksObtained

      answerRows.push({
        enrollmentId: enrollment.id,
        questionId: q.id,
        answer: selected?.option || selected?.id || '',
        isCorrect,
        marksObtained,
      })

      review.push({
        sectionId: q.sectionId,
        sectionTitle: mockTest.sections.find((s: any) => s.id === q.sectionId)?.title || '',
        questionId: q.id,
        question: q.question,
        questionImageUrl: q.questionImageUrl || null,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        selectedOptionId: userAnswer?.optionId || null,
        correctOptionId: q.correctOptionId || null,
        options: q.options.map((o: any) => ({
          id: o.id,
          option: o.option,
          imageUrl: o.imageUrl || null,
        })),
        selectedAnswer: selected?.option || (selected?.imageUrl ? 'Image option' : null),
        correctAnswer: correct?.option || (correct?.imageUrl ? 'Image option' : null),
        isCorrect,
        marksObtained,
      })
    }

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
    const passed = percentage >= 50
    const attemptNumber = (await prisma.mockTestAttempt.count({ where: { enrollmentId: enrollment.id } })) + 1
    const submittedAt = new Date()

    await prisma.$transaction([
      prisma.mockTestAnswer.deleteMany({ where: { enrollmentId: enrollment.id } }),
      prisma.mockTestAnswer.createMany({ data: answerRows }),
      prisma.mockTestAttempt.create({
        data: {
          enrollmentId: enrollment.id,
          userId: session.user.id,
          mockTestId: params.id,
          attemptNumber,
          score,
          totalMarks,
          percentage,
          passed,
          submittedAt,
          review,
        },
      }),
    ])

    return NextResponse.json({
      attemptNumber,
      score,
      totalMarks,
      percentage,
      passed,
      review,
    })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    console.error('Error submitting mock test:', error)
    return NextResponse.json({ error: 'Failed to submit mock test' }, { status: 500 })
  }
}
