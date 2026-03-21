import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const quizUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  thumbnail: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  generateCertificate: z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: {
            questions: {
              include: { options: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
    })

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (!isAdmin && !quiz.isPublished) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

    if (!isAdmin) {
      quiz.sections.forEach((section: any) => {
        section.questions.forEach((question: any) => { delete question.correctOptionId })
      })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = quizUpdateSchema.parse(body)

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.details !== undefined) updateData.details = validatedData.details
    if (validatedData.thumbnail !== undefined) updateData.thumbnail = validatedData.thumbnail
    if (validatedData.expiryDate !== undefined) updateData.expiryDate = validatedData.expiryDate ? new Date(validatedData.expiryDate) : null
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.generateCertificate !== undefined) updateData.generateCertificate = validatedData.generateCertificate
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished

    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: updateData,
      include: { sections: { include: { questions: { include: { options: true } } } } },
    })

    return NextResponse.json(quiz)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    console.error('Error updating quiz:', error)
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.quiz.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }
}
