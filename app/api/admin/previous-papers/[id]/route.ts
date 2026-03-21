import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3).optional(),
  year: z.number().int().optional().nullable(),
  subject: z.string().optional().nullable(),
  format: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  paperUrl: z.string().url().optional().nullable().or(z.literal('')),
  categoryId: z.string().min(1).optional(),
  isLatest: z.boolean().optional(),
  latestUntil: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const row = await prisma.previousPaper.findUnique({
      where: { id: params.id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    if (!row) return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (error) {
    console.error('Error fetching previous paper:', error)
    return NextResponse.json({ error: 'Failed to fetch previous paper' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await prisma.previousPaper.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    const body = await request.json()
    const validated = schema.parse(body)
    const nextLatest = validated.isLatest ?? existing.isLatest
    const row = await prisma.previousPaper.update({
      where: { id: params.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title.trim() }),
        ...(validated.year !== undefined && { year: validated.year ?? null }),
        ...(validated.subject !== undefined && { subject: validated.subject?.trim() || null }),
        ...(validated.format !== undefined && { format: validated.format?.trim() || null }),
        ...(validated.description !== undefined && { description: validated.description || null }),
        ...(validated.coverImageUrl !== undefined && { coverImageUrl: validated.coverImageUrl?.trim() || null }),
        ...(validated.paperUrl !== undefined && { paperUrl: validated.paperUrl?.trim() || null }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.isLatest !== undefined && { isLatest: validated.isLatest }),
        ...(validated.latestUntil !== undefined && {
          latestUntil: nextLatest && validated.latestUntil ? new Date(validated.latestUntil) : null,
        }),
        ...(validated.isPublished !== undefined && { isPublished: validated.isPublished }),
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json(row)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error updating previous paper:', error)
    return NextResponse.json({ error: 'Failed to update previous paper' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.previousPaper.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error deleting previous paper:', error)
    return NextResponse.json({ error: 'Failed to delete previous paper' }, { status: 500 })
  }
}
