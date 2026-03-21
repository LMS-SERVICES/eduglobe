import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''

    const where: any = { isPublished: true }
    if (type) where.type = type
    if (category) where.category = { slug: category }

    const rows = await prisma.syllabus.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching syllabus:', error)
    return NextResponse.json({ error: 'Failed to fetch syllabus' }, { status: 500 })
  }
}
