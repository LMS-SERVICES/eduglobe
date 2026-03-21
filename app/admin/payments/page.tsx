'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, ChevronLeft, ChevronRight, CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface Payment {
  id: string
  razorpayOrderId: string
  amount: number
  currency: string
  status: string
  entityType: string
  entityId: string
  notes?: any
  createdAt: string
  user: { name: string | null; email: string }
  enrollment?: { course: { title: string } }
  quizEnrollment?: { quiz: { title: string } }
}

interface Pagination {
  total: number
  pages: number
  current: number
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`/api/admin/payments?page=${page}&limit=10`)
        if (!response.ok) throw new Error('Failed to fetch payments')
        const data = await response.json()
        setPayments(data.payments || [])
        setPagination(data.pagination || null)
      } catch (err: any) {
        setError(err.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [page])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured':
        return 'text-green-400 bg-green-400/10'
      case 'failed':
        return 'text-red-400 bg-red-400/10'
      case 'created':
        return 'text-blue-400 bg-blue-400/10'
      case 'refunded':
        return 'text-yellow-400 bg-yellow-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'captured':
        return <CheckCircle className="w-4 h-4 mr-1" />
      case 'failed':
        return <XCircle className="w-4 h-4 mr-1" />
      case 'created':
        return <Clock className="w-4 h-4 mr-1" />
      case 'refunded':
        return <AlertCircle className="w-4 h-4 mr-1" />
      default:
        return null
    }
  }

  const resolveItemTitle = (payment: Payment) => {
    if (payment.entityType === 'course') return payment.enrollment?.course.title
    if (payment.entityType === 'quiz') return payment.quizEnrollment?.quiz.title
    const fromNotes = payment.notes && typeof payment.notes === 'object' ? payment.notes.title : null
    return fromNotes || `Mock Test (${payment.entityId?.slice(0, 8) || 'N/A'})`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary-500" />
          Payments
        </h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-dark-900 border border-dark-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-800 border-b border-dark-700">
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{payment.razorpayOrderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{payment.user.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{payment.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {resolveItemTitle(payment) || 'Unknown Item'}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-dark-700 text-gray-400 capitalize">{payment.entityType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-dark-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">Page {pagination.current} of {pagination.pages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
