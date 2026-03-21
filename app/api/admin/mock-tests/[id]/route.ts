import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return !!session?.user?.id && session.user.role === 'ADMIN'
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const test = await prisma.mockTest.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { options: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    })
    if (!test) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    return NextResponse.json(test)
  } catch (error) {
    console.error('Error fetching mock test:', error)
    return NextResponse.json({ error: 'Failed to fetch mock test' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()

    const updated = await prisma.mockTest.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        thumbnail: body.thumbnail,
        durationMinutes: body.durationMinutes,
        isFree: body.isFree,
        price: body.price,
        isPublished: body.isPublished,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating mock test:', error)
    return NextResponse.json({ error: 'Failed to update mock test' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.mockTest.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting mock test:', error)
    return NextResponse.json({ error: 'Failed to delete mock test' }, { status: 500 })
  }
}
