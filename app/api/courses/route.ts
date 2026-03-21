import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const sortBy = searchParams.get('sortBy') || 'popular'

    const where: any = {
      isPublished: true,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = { slug: category }
    }

    let orderBy: any = {}
    const sortByRating = sortBy === 'rating'

    if (!sortByRating) {
      switch (sortBy) {
        case 'price-low':
          orderBy = { price: 'asc' }
          break
        case 'price-high':
          orderBy = { price: 'desc' }
          break
        default:
          orderBy = { createdAt: 'desc' }
      }
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: sortByRating ? undefined : orderBy,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true,
            rating: true,
            totalStudents: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        rating: {
          select: {
            averageRating: true,
            totalReviews: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    if (sortByRating) {
      courses.sort((a, b) => {
        const ratingA = a.rating?.averageRating || 0
        const ratingB = b.rating?.averageRating || 0
        return ratingB - ratingA
      })
    }

    if (sortBy === 'popular') {
      courses.sort((a, b) => {
        const enrollmentsA = a._count?.enrollments || 0
        const enrollmentsB = b._count?.enrollments || 0
        return enrollmentsB - enrollmentsA
      })
    }

    const coursesWithCounts = courses.map((course) => {
      const { _count, ...courseData } = course
      return {
        ...courseData,
        studentsCount: _count?.enrollments || 0,
      }
    })

    return NextResponse.json(coursesWithCounts)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
