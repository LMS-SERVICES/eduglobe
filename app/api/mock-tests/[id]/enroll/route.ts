import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const mockTest = await prisma.mockTest.findUnique({ where: { id: params.id } })
    if (!mockTest) return NextResponse.json({ error: 'Mock test not found' }, { status: 404 })
    if (!mockTest.isPublished) return NextResponse.json({ error: 'Mock test is not available' }, { status: 403 })

    const existing = await prisma.mockTestEnrollment.findUnique({
      where: { userId_mockTestId: { userId: session.user.id, mockTestId: params.id } },
    })
    if (existing) return NextResponse.json({ enrolled: true, enrollment: existing })

    if (!mockTest.isFree && mockTest.price > 0) {
      return NextResponse.json({ error: 'Payment required for this mock test' }, { status: 402 })
    }

    const enrollment = await prisma.mockTestEnrollment.create({
      data: { userId: session.user.id, mockTestId: params.id },
    })

    return NextResponse.json({ enrolled: true, enrollment }, { status: 201 })
  } catch (error) {
    console.error('Error enrolling in mock test:', error)
    return NextResponse.json({ error: 'Failed to enroll in mock test' }, { status: 500 })
  }
}
