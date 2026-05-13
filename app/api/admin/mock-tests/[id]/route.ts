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
    const hasSectionsPayload = Array.isArray(body.sections)

    const updated = await prisma.$transaction(
      async (tx) => {
        const top = await tx.mockTest.update({
          where: { id: params.id },
          data: {
            title: body.title,
            description: body.description,
            instructions: body.instructions,
            thumbnail: body.thumbnail,
            durationMinutes: Number(body.durationMinutes || 60),
            isFree: !!body.isFree,
            price: Number(body.price || 0),
            isPublished: !!body.isPublished,
          },
        })

        if (hasSectionsPayload) {
          await tx.mockTestSection.deleteMany({ where: { mockTestId: params.id } })

          for (let si = 0; si < body.sections.length; si++) {
            const section = body.sections[si]
            const sectionRow = await tx.mockTestSection.create({
              data: {
                mockTestId: params.id,
                title: section.title,
                order: si + 1,
              },
            })

            for (let qi = 0; qi < (section.questions || []).length; qi++) {
              const q = section.questions[qi]
              const opts = Array.isArray(q.options) ? q.options : []
              const questionRow = await tx.mockTestQuestion.create({
                data: {
                  sectionId: sectionRow.id,
                  question: q.question,
                  questionImageUrl: q.questionImageUrl || null,
                  marks: Number(q.marks || 1),
                  negativeMarks: Number(q.negativeMarks || 0),
                  order: qi + 1,
                  options: {
                    create: opts.map((opt: { option: string; imageUrl?: string }, oi: number) => ({
                      option: opt.option,
                      imageUrl: opt.imageUrl || null,
                      order: oi,
                    })),
                  },
                },
                include: { options: true },
              })

              const sortedOpts = [...questionRow.options].sort((a, b) => a.order - b.order)
              const cIdx = Number(q.correctOptionIndex ?? -1)
              if (cIdx >= 0 && sortedOpts[cIdx]) {
                await tx.mockTestQuestion.update({
                  where: { id: questionRow.id },
                  data: { correctOptionId: sortedOpts[cIdx].id },
                })
              }
            }
          }
        }

        return top
      },
      { maxWait: 15_000, timeout: 120_000 }
    )

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
