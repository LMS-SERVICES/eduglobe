import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.academicCategory.findMany({
      include: { _count: { select: { courses: { where: { isPublished: true } } } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching academic categories:', error)
    return NextResponse.json({ error: 'Failed to fetch academic categories' }, { status: 500 })
  }
}
