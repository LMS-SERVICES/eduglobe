import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return !!session?.user?.id && session.user.role === 'ADMIN'
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching admin quiz:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: any = {}
    const hasSectionsPayload = Array.isArray(body.sections)

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.details !== undefined) updateData.details = body.details
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail
    if (body.expiryDate !== undefined) updateData.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    if (body.price !== undefined) updateData.price = body.price
    if (body.generateCertificate !== undefined) updateData.generateCertificate = body.generateCertificate
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished

    const quiz = await prisma.$transaction(async (tx) => {
      const top = await tx.quiz.update({
        where: { id: params.id },
        data: updateData,
      })

      if (hasSectionsPayload) {
        await tx.quizSection.deleteMany({ where: { quizId: params.id } })

        for (let si = 0; si < body.sections.length; si++) {
          const section = body.sections[si]
          const sectionRow = await tx.quizSection.create({
            data: {
              quizId: params.id,
              title: section.title,
              order: si + 1,
            },
          })

          for (let qi = 0; qi < (section.questions || []).length; qi++) {
            const q = section.questions[qi]
            const opts = Array.isArray(q.options) ? q.options : []
            const correctOptionIndex = opts.findIndex(
              (opt: any) =>
                opt.id === q.correctOptionId ||
                String(opt.order) === String(q.correctOptionId)
            )
            const question = await tx.quizQuestion.create({
              data: {
                sectionId: sectionRow.id,
                question: q.question,
                questionImageUrl: q.questionImageUrl || null,
                marks: Number(q.marks || 1),
                order: qi + 1,
                options: {
                  create: opts.map((opt: any, oi: number) => ({
                    option: opt.option,
                    imageUrl: opt.imageUrl || null,
                    order: Number.isFinite(Number(opt.order)) ? Number(opt.order) : oi,
                  })),
                },
              },
              include: { options: true },
            })

            const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)
            const correctOption = sortedOptions[correctOptionIndex]
            if (correctOption) {
              await tx.quizQuestion.update({
                where: { id: question.id },
                data: { correctOptionId: correctOption.id },
              })
            }
          }
        }
      }

      return top
    }, { maxWait: 15_000, timeout: 120_000 })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error updating admin quiz:', error)
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.quiz.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin quiz:', error)
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }
}
