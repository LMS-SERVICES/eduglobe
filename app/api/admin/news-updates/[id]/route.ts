import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNewsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  tag: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  coverImage: z.string().url('Cover image must be a valid URL').optional().nullable().or(z.literal('')),
  isPublished: z.boolean().optional(),
  isLatest: z.boolean().optional(),
  latestUntil: z.string().optional().nullable(),
})

const createSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const item = await prisma.newsUpdate.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: 'News update not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching news update:', error)
    return NextResponse.json({ error: 'Failed to fetch news update' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.newsUpdate.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'News update not found' }, { status: 404 })

    const body = await request.json()
    const validatedData = updateNewsSchema.parse(body)
    let slug = existing.slug

    if (validatedData.title && validatedData.title.trim() !== existing.title) {
      const baseSlug = createSlug(validatedData.title.trim()) || 'news'
      const slugExists = await prisma.newsUpdate.findUnique({ where: { slug: baseSlug } })
      slug = slugExists && slugExists.id !== params.id ? `${baseSlug}-${Date.now()}` : baseSlug
    }

    const nextPublished = validatedData.isPublished ?? existing.isPublished
    const nextLatest = validatedData.isLatest ?? existing.isLatest
    const item = await prisma.newsUpdate.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title.trim() }),
        ...(validatedData.tag !== undefined && { tag: validatedData.tag?.trim() || null }),
        ...(validatedData.excerpt !== undefined && { excerpt: validatedData.excerpt?.trim() || null }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.coverImage !== undefined && { coverImage: validatedData.coverImage?.trim() || null }),
        slug,
        isPublished: nextPublished,
        isLatest: nextLatest,
        ...(validatedData.latestUntil !== undefined && {
          latestUntil:
            nextLatest && validatedData.latestUntil
              ? new Date(validatedData.latestUntil)
              : null,
        }),
        ...(validatedData.isLatest !== undefined &&
          !validatedData.isLatest && {
            latestUntil: null,
          }),
        publishedAt: nextPublished ? existing.publishedAt || new Date() : null,
      },
    })

    return NextResponse.json(item)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error updating news update:', error)
    return NextResponse.json({ error: 'Failed to update news update' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.newsUpdate.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'News update not found' }, { status: 404 })

    await prisma.newsUpdate.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'News update deleted successfully' })
  } catch (error) {
    console.error('Error deleting news update:', error)
    return NextResponse.json({ error: 'Failed to delete news update' }, { status: 500 })
  }
}
