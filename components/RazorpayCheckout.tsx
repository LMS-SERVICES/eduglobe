'use client'

import { useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface RazorpayCheckoutProps {
  entityType: 'course' | 'quiz' | 'mockTest'
  entityId: string
  title: string
  price: number
  onSuccess?: () => void
  className?: string
  children?: React.ReactNode
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function RazorpayCheckout({
  entityType,
  entityId,
  title,
  price,
  onSuccess,
  className,
  children,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handlePayment = async () => {
    if (loading) return

    if (!session?.user?.id) {
      const callback =
        entityType === 'course'
          ? `/courses/${entityId}`
          : entityType === 'quiz'
          ? `/quizzes/${entityId}`
          : `/mock-test/${entityId}`
      router.push(`/login?callback=${encodeURIComponent(callback)}`)
      return
    }

    setLoading(true)
    try {
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, amount: price }),
      })
      const orderData = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(orderData.error || 'Failed to create order')

      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded')

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'EduGlobe',
        description: `Payment for ${title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                entityType,
                entityId,
              }),
            })
            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok) throw new Error(verifyData.error || 'Payment verification failed')

            if (onSuccess) onSuccess()
            else if (entityType === 'quiz') router.push(`/quizzes/${entityId}/take`)
            else if (entityType === 'mockTest') router.push(`/mock-test/${entityId}/take`)
            else router.refresh()
          } catch (err: any) {
            alert(err.message || 'Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.on('payment.failed', function (response: any) {
        alert(response?.error?.description || 'Payment failed')
        setLoading(false)
      })
      paymentObject.open()
    } catch (error: any) {
      alert(error.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  return (
    <>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <button
        onClick={handlePayment}
        disabled={loading}
        className={
          className ||
          'w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50'
        }
      >
        {loading ? 'Processing...' : children || `Pay ₹${price.toFixed(0)} & Enroll`}
      </button>
    </>
  )
}
