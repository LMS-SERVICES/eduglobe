import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const step1Schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Short description is required'),
  descriptionFull: z.string().min(2, 'Full description is required'),
  thumbnail: z.string().url('Invalid thumbnail URL'),
  categoryId: z.string().min(1, 'Category is required'),
})

const step2Schema = z.object({
  whatYouWillLearn: z.array(z.string()).min(1, 'At least one learning point is required'),
})

const step3Schema = z.object({
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
})

const step4Schema = z.object({
  sections: z.array(
    z.object({
      title: z.string().min(1, 'Section title is required'),
      lessons: z.array(
        z.object({
          title: z.string().min(1, 'Lesson title is required'),
          type: z.enum(['video', 'document', 'quiz']),
          videoUrl: z.string().url().optional().nullable(),
          documentUrl: z.string().url().optional().nullable(),
          quizId: z.string().optional().nullable(),
        }).superRefine((lesson, ctx) => {
          if (lesson.type === 'video' && !lesson.videoUrl) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Video URL is required for video lesson' })
          }
          if (lesson.type === 'document' && !lesson.documentUrl) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Document URL is required for document lesson' })
          }
          if (lesson.type === 'quiz' && !lesson.quizId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Quiz selection is required for quiz lesson' })
          }
        })
      ).min(1, 'Each section must have at least one lesson'),
    })
  ).min(1, 'At least one section is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const step = Number(body?.step || 0)
    const payload = body?.payload || {}

    if (step === 1) step1Schema.parse(payload)
    else if (step === 2) step2Schema.parse(payload)
    else if (step === 3) step3Schema.parse(payload)
    else if (step === 4) step4Schema.parse(payload)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error validating course step:', error)
    return NextResponse.json({ error: 'Failed to validate step' }, { status: 500 })
  }
}
