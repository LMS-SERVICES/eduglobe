import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const safe = async (fn: () => Promise<number>) => {
      try {
        return await fn()
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
          return 0
        }
        throw error
      }
    }

    const [
      totalCourses,
      publishedCourses,
      totalCategories,
      totalQuizzes,
      publishedQuizzes,
      totalUsers,
      thisMonthCourses,
      thisMonthPublished,
      thisMonthQuizzes,
      thisMonthPublishedQuizzes,
      thisMonthCategories,
      thisMonthUsers,
      lastMonthCourses,
      lastMonthPublished,
      lastMonthQuizzes,
      lastMonthPublishedQuizzes,
      lastMonthCategories,
      lastMonthUsers,
    ] = await Promise.all([
      safe(() => prisma.course.count()),
      safe(() => prisma.course.count({ where: { isPublished: true } })),
      safe(() => prisma.category.count()),
      safe(() => prisma.quiz.count()),
      safe(() => prisma.quiz.count({ where: { isPublished: true } })),
      safe(() => prisma.user.count()),
      safe(() => prisma.course.count({ where: { createdAt: { gte: thisMonthStart } } })),
      safe(() => prisma.course.count({ where: { isPublished: true, createdAt: { gte: thisMonthStart } } })),
      safe(() => prisma.quiz.count({ where: { createdAt: { gte: thisMonthStart } } })),
      safe(() => prisma.quiz.count({ where: { isPublished: true, createdAt: { gte: thisMonthStart } } })),
      safe(() => prisma.category.count({ where: { createdAt: { gte: thisMonthStart } } })),
      safe(() => prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } })),
      safe(() => prisma.course.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } })),
      safe(() => prisma.course.count({ where: { isPublished: true, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } })),
      safe(() => prisma.quiz.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } })),
      safe(() => prisma.quiz.count({ where: { isPublished: true, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } })),
      safe(() => prisma.category.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } })),
      safe(() => prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } })),
    ])

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return NextResponse.json({
      totalCourses,
      totalCategories,
      totalQuizzes,
      publishedQuizzes,
      totalUsers,
      totalRevenue: 0,
      publishedCourses,
      thisMonth: {
        courses: thisMonthCourses,
        publishedCourses: thisMonthPublished,
        users: thisMonthUsers,
        quizzes: thisMonthQuizzes,
        publishedQuizzes: thisMonthPublishedQuizzes,
        categories: thisMonthCategories,
        revenue: 0,
        enrollments: 0,
      },
      lastMonth: {
        courses: lastMonthCourses,
        publishedCourses: lastMonthPublished,
        users: lastMonthUsers,
        quizzes: lastMonthQuizzes,
        publishedQuizzes: lastMonthPublishedQuizzes,
        categories: lastMonthCategories,
        revenue: 0,
        enrollments: 0,
      },
      changes: {
        courses: calcChange(thisMonthCourses, lastMonthCourses),
        publishedCourses: calcChange(thisMonthPublished, lastMonthPublished),
        users: calcChange(thisMonthUsers, lastMonthUsers),
        quizzes: calcChange(thisMonthQuizzes, lastMonthQuizzes),
        publishedQuizzes: calcChange(thisMonthPublishedQuizzes, lastMonthPublishedQuizzes),
        categories: calcChange(thisMonthCategories, lastMonthCategories),
        revenue: 0,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
