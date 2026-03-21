import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.category.findMany({
      include: { _count: { select: { previousPapers: { where: { isPublished: true } } } } },
      orderBy: { name: 'asc' },
    })
    const mapped = rows.map((row) => ({
      ...row,
      _count: { papers: (row as any)._count?.previousPapers || 0 },
    }))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error fetching previous paper categories:', error)
    return NextResponse.json({ error: 'Failed to fetch previous paper categories' }, { status: 500 })
  }
}
