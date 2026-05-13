import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasQuizAccessViaCourseEnrollment } from '@/lib/quiz-course-access'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const enrollment = await prisma.quizEnrollment.findUnique({
      where: { userId_quizId: { userId: session.user.id, quizId: params.id } },
      include: {
        quiz: { select: { id: true, title: true, isPublished: true } },
        answers: {
          include: {
            question: { include: { options: true, section: { select: { id: true, title: true } } } },
          },
        },
      },
    })

    if (!enrollment) {
      const freeViaCourse = await hasQuizAccessViaCourseEnrollment(session.user.id, params.id)
      return NextResponse.json({ enrolled: false, freeViaCourse })
    }

    const latestAttempt = await prisma.quizAttempt.findFirst({
      where: { enrollmentId: enrollment.id },
      orderBy: { attemptNumber: 'desc' },
      select: { attemptNumber: true, review: true },
    })

    const review = (enrollment.answers || []).map((a: any) => {
      const correctOption = a.question.options.find((opt: any) => opt.id === a.question.correctOptionId)
      const selectedOption = a.question.options.find((opt: any) => opt.option === a.answer || opt.id === a.answer)
      return {
        sectionId: a.question.section.id,
        sectionTitle: a.question.section.title,
        questionId: a.question.id,
        question: a.question.question,
        questionImageUrl: a.question.questionImageUrl || null,
        marks: a.question.marks,
        selectedOptionId: selectedOption?.id || null,
        correctOptionId: a.question.correctOptionId || null,
        options: a.question.options.map((opt: any) => ({
          id: opt.id,
          option: opt.option,
          imageUrl: opt.imageUrl || null,
        })),
        selectedAnswer: a.answer || null,
        correctAnswer: correctOption?.option || (correctOption?.imageUrl ? 'Image option' : null),
        isCorrect: a.isCorrect,
        marksObtained: a.marksObtained,
      }
    })

    return NextResponse.json({
      enrolled: true,
      enrollment: {
        id: enrollment.id,
        completedAt: enrollment.completedAt,
        score: enrollment.score,
        totalMarks: enrollment.totalMarks,
        percentage: enrollment.percentage,
        certificate: enrollment.certificate,
        attemptNumber: latestAttempt?.attemptNumber || 0,
      },
      passed: (enrollment.percentage || 0) >= 50,
      review: latestAttempt?.review || review,
    })
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 })
  }
}
