import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifySignature } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, entityType, entityId } = body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required payment details' }, { status: 400 })
    }

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    })
    if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
      },
    })

    if (entityType === 'course') {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: entityId } },
      })
      if (!existing) {
        await prisma.enrollment.create({
          data: { userId: session.user.id, courseId: entityId, paymentId: payment.id },
        })
      }
    } else if (entityType === 'quiz') {
      const existing = await prisma.quizEnrollment.findUnique({
        where: { userId_quizId: { userId: session.user.id, quizId: entityId } },
      })
      if (!existing) {
        await prisma.quizEnrollment.create({
          data: { userId: session.user.id, quizId: entityId, paymentId: payment.id },
        })
      }
    } else if (entityType === 'mockTest') {
      const existing = await prisma.mockTestEnrollment.findUnique({
        where: { userId_mockTestId: { userId: session.user.id, mockTestId: entityId } },
      })
      if (!existing) {
        await prisma.mockTestEnrollment.create({
          data: { userId: session.user.id, mockTestId: entityId },
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Payment verified and enrollment created' })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
