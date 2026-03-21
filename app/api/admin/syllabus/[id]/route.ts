import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3).optional(),
  type: z.enum(['SYLLABUS', 'NOTIFICATION']).optional(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  categoryId: z.string().min(1).optional(),
  eventDateText: z.string().optional().nullable(),
  isLatest: z.boolean().optional(),
  latestUntil: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const row = await prisma.syllabus.findUnique({
      where: { id: params.id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    if (!row) return NextResponse.json({ error: 'Syllabus item not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (error) {
    console.error('Error fetching syllabus item:', error)
    return NextResponse.json({ error: 'Failed to fetch syllabus item' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await prisma.syllabus.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Syllabus item not found' }, { status: 404 })
    const body = await request.json()
    const validated = schema.parse(body)
    const nextLatest = validated.isLatest ?? existing.isLatest
    const row = await prisma.syllabus.update({
      where: { id: params.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title.trim() }),
        ...(validated.type !== undefined && { type: validated.type }),
        ...(validated.summary !== undefined && { summary: validated.summary?.trim() || null }),
        ...(validated.content !== undefined && { content: validated.content || null }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.eventDateText !== undefined && { eventDateText: validated.eventDateText?.trim() || null }),
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
    console.error('Error updating syllabus item:', error)
    return NextResponse.json({ error: 'Failed to update syllabus item' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.syllabus.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error deleting syllabus item:', error)
    return NextResponse.json({ error: 'Failed to delete syllabus item' }, { status: 500 })
  }
}
