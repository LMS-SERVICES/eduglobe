import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  thumbnail: z.string().url('Invalid thumbnail URL').optional().nullable().or(z.literal('')),
  price: z.number().min(0).default(0),
  duration: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  isPublished: z.boolean().optional().default(false),
})

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const courses = await prisma.academicCourse.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(courses.map((c) => ({ ...c, price: Number(c.price || 0) })))
  } catch (error) {
    console.error('Error fetching academic courses:', error)
    return NextResponse.json({ error: 'Failed to fetch academic courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = schema.parse(body)
    const baseSlug = toSlug(validated.title.trim()) || 'academic-course'
    const exists = await prisma.academicCourse.findUnique({ where: { slug: baseSlug } })
    const slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug
    const created = await prisma.academicCourse.create({
      data: {
        title: validated.title.trim(),
        slug,
        description: validated.description,
        thumbnail: validated.thumbnail?.trim() || null,
        price: validated.price,
        duration: validated.duration?.trim() || null,
        level: validated.level?.trim() || null,
        categoryId: validated.categoryId,
        isPublished: validated.isPublished,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json({ ...created, price: Number(created.price || 0) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Error creating academic course:', error)
    return NextResponse.json({ error: 'Failed to create academic course' }, { status: 500 })
  }
}
