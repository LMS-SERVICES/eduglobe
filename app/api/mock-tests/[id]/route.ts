import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

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
        _count: { select: { enrollments: true } },
      },
    })

    if (!test) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    if (!isAdmin && !test.isPublished) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })

    if (!isAdmin) {
      test.sections.forEach((s: any) => {
        s.questions.forEach((q: any) => {
          delete q.correctOptionId
        })
      })
    }

    return NextResponse.json(test)
  } catch (error) {
    console.error('Error fetching mock test:', error)
    return NextResponse.json({ error: 'Failed to fetch mock test' }, { status: 500 })
  }
}
