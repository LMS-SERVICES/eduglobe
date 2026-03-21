import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        image: true,
        role: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                description: true,
                duration: true,
                language: true,
                price: true,
                lecturesCount: true,
                category: {
                  select: {
                    name: true,
                  },
                },
                instructor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            progress: {
              select: {
                completed: true,
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        },
        quizEnrollments: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true,
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const enrollmentsWithProgress = user.enrollments.map((enrollment) => {
      const completedLessons = enrollment.progress.filter((p) => p.completed).length
      const totalLessons = enrollment.progress.length
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      return {
        ...enrollment,
        completedLessons,
        totalLessons,
        progressPercentage,
      }
    })

    const totalLessonsCompleted = enrollmentsWithProgress.reduce(
      (sum, enrollment) => sum + enrollment.completedLessons,
      0
    )
    const totalLessonsAvailable = enrollmentsWithProgress.reduce(
      (sum, enrollment) => sum + enrollment.totalLessons,
      0
    )
    const overallCourseProgress =
      totalLessonsAvailable > 0 ? Math.round((totalLessonsCompleted / totalLessonsAvailable) * 100) : 0

    const completedCourses = enrollmentsWithProgress.filter((enrollment) => enrollment.progressPercentage === 100).length
    const completedQuizAttempts = user.quizEnrollments.filter(
      (quizEnrollment) => quizEnrollment.completedAt && quizEnrollment.percentage !== null
    )
    const averageQuizScore =
      completedQuizAttempts.length > 0
        ? Number(
            (
              completedQuizAttempts.reduce(
                (sum, quizEnrollment) => sum + (quizEnrollment.percentage || 0),
                0
              ) / completedQuizAttempts.length
            ).toFixed(1)
          )
        : 0

    const lastActivityDates = [
      ...user.enrollments.map((enrollment) => new Date(enrollment.enrolledAt).getTime()),
      ...user.quizEnrollments.map((quizEnrollment) => new Date(quizEnrollment.enrolledAt).getTime()),
      new Date(user.createdAt).getTime(),
    ]
    const lastActiveAt = new Date(Math.max(...lastActivityDates)).toISOString()

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
      },
      enrollments: enrollmentsWithProgress,
      quizEnrollments: user.quizEnrollments,
      stats: {
        totalCourses: user.enrollments.length,
        totalQuizzes: user.quizEnrollments.length,
        completedQuizzes: user.quizEnrollments.filter((q) => q.completedAt).length,
        completedCourses,
        totalLessonsCompleted,
        totalLessonsAvailable,
        overallCourseProgress,
        averageQuizScore,
        lastActiveAt,
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
