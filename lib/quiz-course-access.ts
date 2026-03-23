import { prisma } from '@/lib/prisma'

/**
 * True if this quiz appears as a lesson (`type === 'quiz'`, `content` = quiz id) in any course
 * the user is enrolled in. Those users should not pay again at the standalone quiz checkout.
 */
export async function hasQuizAccessViaCourseEnrollment(userId: string, quizId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      type: 'quiz',
      content: quizId,
      subsection: {
        section: {
          course: {
            enrollments: {
              some: { userId },
            },
          },
        },
      },
    },
    select: { id: true },
  })
  return !!lesson
}
