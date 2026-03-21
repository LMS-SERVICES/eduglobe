import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createOrder } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId } = body
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID are required' }, { status: 400 })
    }

    let amount = 0
    let title = ''

    if (entityType === 'course') {
      const course = await prisma.course.findUnique({ where: { id: entityId } })
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      if (!course.isPublished) return NextResponse.json({ error: 'Course is not available' }, { status: 403 })

      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: entityId } },
      })
      if (existing) return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 })

      amount = course.price
      title = course.title
    } else if (entityType === 'quiz') {
      const quiz = await prisma.quiz.findUnique({ where: { id: entityId } })
      if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
      if (!quiz.isPublished) return NextResponse.json({ error: 'Quiz is not available' }, { status: 403 })

      const existing = await prisma.quizEnrollment.findUnique({
        where: { userId_quizId: { userId: session.user.id, quizId: entityId } },
      })
      if (existing) return NextResponse.json({ error: 'Already enrolled in this quiz' }, { status: 400 })

      amount = quiz.price
      title = quiz.title
    } else {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'This item is free, enroll directly' }, { status: 400 })
    }

    const receipt = `rcpt_${entityType.substring(0, 3)}_${entityId.substring(0, 6)}_${Date.now()}`
    const order = await createOrder(amount, 'INR', receipt)

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        razorpayOrderId: order.id,
        amount,
        currency: order.currency,
        status: 'created',
        entityType,
        entityId,
        receipt,
        notes: {
          title,
          description: `Payment for ${entityType}: ${title}`,
        },
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error('Error creating payment order:', error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: error?.statusCode || 500 })
  }
}
