import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''

    const where: any = { isPublished: true }
    if (category) where.category = { slug: category }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ]
    }

    const rows = await prisma.previousPaper.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ isLatest: 'desc' }, { year: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching previous papers:', error)
    return NextResponse.json({ error: 'Failed to fetch previous papers' }, { status: 500 })
  }
}
