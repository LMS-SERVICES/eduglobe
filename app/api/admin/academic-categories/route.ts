import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
})

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const categories = await prisma.academicCategory.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching academic categories:', error)
    return NextResponse.json({ error: 'Failed to fetch academic categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = categorySchema.parse(body)
    const name = validated.name.trim()
    if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    const baseSlug = toSlug(name) || 'academic-category'
    const exists = await prisma.academicCategory.findUnique({ where: { slug: baseSlug } })
    const slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug
    const item = await prisma.academicCategory.create({
      data: { name, slug, description: validated.description || null },
      include: { _count: { select: { courses: true } } },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error creating academic category:', error)
    return NextResponse.json({ error: 'Failed to create academic category' }, { status: 500 })
  }
}
