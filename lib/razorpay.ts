import Razorpay from 'razorpay'
import crypto from 'crypto'

const key_id = process.env.RAZORPAY_KEY_ID || 'dummy_key_id'
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret'

export const razorpay = new Razorpay({
  key_id,
  key_secret,
})

export const createOrder = async (amount: number, currency: string = 'INR', receipt: string) => {
  const options = {
    amount: Math.round(amount * 100),
    currency,
    receipt,
  }
  return razorpay.orders.create(options)
}

export const verifySignature = (orderId: string, paymentId: string, signature: string): boolean => {
  const text = `${orderId}|${paymentId}`
  const generated = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(text).digest('hex')
  return generated === signature
}
