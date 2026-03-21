import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  thumbnail: z.string().url().optional().nullable().or(z.literal('')),
  price: z.number().min(0).optional(),
  duration: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  categoryId: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
})

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const item = await prisma.academicCourse.findUnique({
      where: { id: params.id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    return NextResponse.json({ ...item, price: Number(item.price || 0) })
  } catch (error) {
    console.error('Error fetching academic course:', error)
    return NextResponse.json({ error: 'Failed to fetch academic course' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await prisma.academicCourse.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    const body = await request.json()
    const validated = schema.parse(body)

    let slug = existing.slug
    if (validated.title && validated.title.trim() !== existing.title) {
      const baseSlug = toSlug(validated.title.trim()) || 'academic-course'
      const hit = await prisma.academicCourse.findUnique({ where: { slug: baseSlug } })
      slug = hit && hit.id !== params.id ? `${baseSlug}-${Date.now()}` : baseSlug
    }

    const updated = await prisma.academicCourse.update({
      where: { id: params.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title.trim() }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.thumbnail !== undefined && { thumbnail: validated.thumbnail?.trim() || null }),
        ...(validated.price !== undefined && { price: validated.price }),
        ...(validated.duration !== undefined && { duration: validated.duration?.trim() || null }),
        ...(validated.level !== undefined && { level: validated.level?.trim() || null }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.isPublished !== undefined && { isPublished: validated.isPublished }),
        slug,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json({ ...updated, price: Number(updated.price || 0) })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error updating academic course:', error)
    return NextResponse.json({ error: 'Failed to update academic course' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.academicCourse.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error deleting academic course:', error)
    return NextResponse.json({ error: 'Failed to delete academic course' }, { status: 500 })
  }
}
