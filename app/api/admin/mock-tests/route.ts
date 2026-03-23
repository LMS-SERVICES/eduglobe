import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function isAdmin(session: any) {
  return !!session?.user?.id && session.user.role === 'ADMIN'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tests = await prisma.mockTest.findMany({
      include: {
        sections: { include: { questions: true } },
        _count: { select: { enrollments: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('Error fetching admin mock tests:', error)
    return NextResponse.json({ error: 'Failed to fetch mock tests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const baseSlug = slugify(body.title || '')
    if (!baseSlug) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const exists = await prisma.mockTest.findUnique({ where: { slug: baseSlug } })
    const slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug

    // Avoid Promise.all parallel writes inside interactive $transaction — breaks with Neon/pooler (P2028).
    // Use nested creates (single round-trip per question) instead.
    const created = await prisma.$transaction(
      async (tx) => {
        const mock = await tx.mockTest.create({
          data: {
            title: body.title,
            slug,
            description: body.description || null,
            instructions: body.instructions || null,
            thumbnail: body.thumbnail || null,
            durationMinutes: Number(body.durationMinutes || 60),
            isFree: !!body.isFree,
            price: Number(body.price || 0),
            isPublished: !!body.isPublished,
          },
        })

        for (let si = 0; si < (body.sections || []).length; si++) {
          const section = body.sections[si]
          const sectionRow = await tx.mockTestSection.create({
            data: {
              mockTestId: mock.id,
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
                  create: opts.map((opt: { option: string }, oi: number) => ({
                    option: opt.option,
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

        return mock
      },
      { maxWait: 15_000, timeout: 120_000 }
    )

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (error) {
    console.error('Error creating mock test:', error)
    return NextResponse.json({ error: 'Failed to create mock test' }, { status: 500 })
  }
}
