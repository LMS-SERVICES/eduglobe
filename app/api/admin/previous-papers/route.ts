import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  year: z.number().int().optional().nullable(),
  subject: z.string().optional().nullable(),
  format: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().url('Image URL must be valid').optional().nullable().or(z.literal('')),
  paperUrl: z.string().url('Paper URL must be valid').optional().nullable().or(z.literal('')),
  categoryId: z.string().min(1, 'Category is required'),
  isLatest: z.boolean().optional().default(false),
  latestUntil: z.string().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await prisma.previousPaper.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching previous papers:', error)
    return NextResponse.json({ error: 'Failed to fetch previous papers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = schema.parse(body)
    const row = await prisma.previousPaper.create({
      data: {
        title: validated.title.trim(),
        year: validated.year ?? null,
        subject: validated.subject?.trim() || null,
        format: validated.format?.trim() || 'PDF',
        description: validated.description || null,
        coverImageUrl: validated.coverImageUrl?.trim() || null,
        paperUrl: validated.paperUrl?.trim() || null,
        categoryId: validated.categoryId,
        isLatest: validated.isLatest,
        latestUntil: validated.isLatest && validated.latestUntil ? new Date(validated.latestUntil) : null,
        isPublished: validated.isPublished,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error creating previous paper:', error)
    return NextResponse.json({ error: 'Failed to create previous paper' }, { status: 500 })
  }
}
