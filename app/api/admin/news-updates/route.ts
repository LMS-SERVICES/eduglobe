import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const newsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  tag: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  coverImage: z.string().url('Cover image must be a valid URL').optional().nullable().or(z.literal('')),
  isPublished: z.boolean().optional().default(false),
  isLatest: z.boolean().optional().default(false),
  latestUntil: z.string().optional().nullable(),
})

const createSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await prisma.newsUpdate.findMany({
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching news updates:', error)
    return NextResponse.json({ error: 'Failed to fetch news updates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = newsSchema.parse(body)
    const normalizedTitle = validatedData.title.trim()
    const baseSlug = createSlug(normalizedTitle) || 'news'
    const existing = await prisma.newsUpdate.findUnique({ where: { slug: baseSlug } })
    const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

    const item = await prisma.newsUpdate.create({
      data: {
        title: normalizedTitle,
        slug: finalSlug,
        tag: validatedData.tag?.trim() || null,
        excerpt: validatedData.excerpt?.trim() || null,
        content: validatedData.content,
        coverImage: validatedData.coverImage?.trim() || null,
        isPublished: validatedData.isPublished,
        isLatest: validatedData.isLatest,
        latestUntil:
          validatedData.isLatest && validatedData.latestUntil
            ? new Date(validatedData.latestUntil)
            : null,
        publishedAt: validatedData.isPublished ? new Date() : null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A post with similar slug already exists' }, { status: 400 })
    }
    console.error('Error creating news update:', error)
    return NextResponse.json({ error: 'Failed to create news update' }, { status: 500 })
  }
}
