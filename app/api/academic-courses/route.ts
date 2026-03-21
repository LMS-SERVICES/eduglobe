import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: any = { isPublished: true }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = { slug: category }

    const courses = await prisma.academicCourse.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(courses.map((c) => ({ ...c, price: Number(c.price || 0) })))
  } catch (error) {
    console.error('Error fetching academic courses:', error)
    return NextResponse.json({ error: 'Failed to fetch academic courses' }, { status: 500 })
  }
}
