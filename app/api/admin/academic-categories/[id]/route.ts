import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
})

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = schema.parse(body)
    const existing = await prisma.academicCategory.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    const name = validated.name.trim()
    const baseSlug = toSlug(name) || 'academic-category'
    const slugHit = await prisma.academicCategory.findUnique({ where: { slug: baseSlug } })
    const slug = slugHit && slugHit.id !== params.id ? `${baseSlug}-${Date.now()}` : baseSlug
    const item = await prisma.academicCategory.update({
      where: { id: params.id },
      data: { name, slug, description: validated.description || null },
      include: { _count: { select: { courses: true } } },
    })
    return NextResponse.json(item)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error updating academic category:', error)
    return NextResponse.json({ error: 'Failed to update academic category' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await prisma.academicCategory.findUnique({
      where: { id: params.id },
      include: { _count: { select: { courses: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    if ((existing._count?.courses || 0) > 0) return NextResponse.json({ error: 'Cannot delete category with courses' }, { status: 400 })
    await prisma.academicCategory.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error deleting academic category:', error)
    return NextResponse.json({ error: 'Failed to delete academic category' }, { status: 500 })
  }
}
