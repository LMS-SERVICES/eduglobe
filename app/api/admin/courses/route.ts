import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        instructor: {
          select: { id: true, name: true, image: true },
        },
        rating: {
          select: { averageRating: true, totalReviews: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const coursesWithCounts = courses.map((course) => {
      const { _count, ...courseData } = course
      return {
        ...courseData,
        price: Number(course.price || 0),
        originalPrice: Number(course.originalPrice || 0),
        studentsCount: _count?.enrollments || 0,
      }
    })

    return NextResponse.json(coursesWithCounts)
  } catch (error) {
    console.error('Error fetching admin courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
