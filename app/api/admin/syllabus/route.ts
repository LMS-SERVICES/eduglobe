import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(['SYLLABUS', 'NOTIFICATION']).default('SYLLABUS'),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  eventDateText: z.string().optional().nullable(),
  isLatest: z.boolean().optional().default(false),
  latestUntil: z.string().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await prisma.syllabus.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ createdAt: 'desc' }],
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching syllabi:', error)
    return NextResponse.json({ error: 'Failed to fetch syllabi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = schema.parse(body)
    const row = await prisma.syllabus.create({
      data: {
        title: validated.title.trim(),
        type: validated.type,
        summary: validated.summary?.trim() || null,
        content: validated.content || null,
        categoryId: validated.categoryId,
        eventDateText: validated.eventDateText?.trim() || null,
        isLatest: validated.isLatest,
        latestUntil: validated.isLatest && validated.latestUntil ? new Date(validated.latestUntil) : null,
        isPublished: validated.isPublished,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error creating syllabus item:', error)
    return NextResponse.json({ error: 'Failed to create syllabus item' }, { status: 500 })
  }
}
