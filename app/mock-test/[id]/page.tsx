'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import RazorpayCheckout from '@/components/RazorpayCheckout'
import { toastError, toastSuccess } from '@/lib/toast'

interface MockTest {
  id: string
  title: string
  description?: string
  instructions?: string
  durationMinutes: number
  isFree: boolean
  price: number
  sections: { id: string; title: string; questions: any[] }[]
}

interface Attempt {
  id: string
  attemptNumber: number
  score: number
  totalMarks: number
  percentage: number
  passed: boolean
  submittedAt: string
}

export default function MockTestDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [test, setTest] = useState<MockTest | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/mock-tests/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/mock-tests/${id}/attempts`).then((r) => (r.ok ? r.json() : { attempts: [] })),
      fetch(`/api/mock-tests/${id}/enrollment`).then((r) => (r.ok ? r.json() : { enrolled: false })),
    ])
      .then(([testData, attemptsData, enrollmentData]) => {
        setTest(testData)
        setAttempts(attemptsData?.attempts || [])
        setEnrolled(!!enrollmentData?.enrolled)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const start = async () => {
    const enroll = await fetch(`/api/mock-tests/${id}/enroll`, { method: 'POST' })
    if (!enroll.ok) {
      const data = await enroll.json().catch(() => ({}))
      toastError('Could not start mock test', data.error || 'Please try again.')
      return
    }
    toastSuccess('Good luck', 'The test is opening.')
    router.push(`/mock-test/${id}/take`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
  if (!test) return <div className="min-h-screen flex items-center justify-center text-slate-500">Mock test not found</div>

  const totalQuestions = test.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/mock-test" className="text-primary hover:text-primary-light">Back to Mock Tests</Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h1 className="text-3xl font-bold text-slate-800">{test.title}</h1>
          <p className="mt-2 text-slate-600">{test.description || 'No description added.'}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">Duration: {test.durationMinutes} min</span>
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">Questions: {totalQuestions}</span>
            <span className={`px-2 py-1 rounded ${test.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {test.isFree ? 'Free Mock' : `Paid (INR ${test.price})`}
            </span>
          </div>
          {test.instructions && (
            <div className="mt-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="font-semibold mb-1">Instructions</p>
              <div dangerouslySetInnerHTML={{ __html: test.instructions }} />
            </div>
          )}
          {enrolled ? (
            <button onClick={() => router.push(`/mock-test/${id}/take`)} className="mt-5 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light">
              Start Mock Test
            </button>
          ) : test.isFree || test.price <= 0 ? (
            <button onClick={start} className="mt-5 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light">
              Start Mock Test
            </button>
          ) : (
            <div className="mt-5 max-w-xs">
              <RazorpayCheckout
                entityType="mockTest"
                entityId={test.id}
                title={test.title}
                price={test.price}
                onSuccess={() => router.push(`/mock-test/${id}/take`)}
                className="w-full px-6 py-3 bg-accent-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Enroll Now
              </RazorpayCheckout>
            </div>
          )}
        </div>

        {attempts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Attempt History</h2>
            <div className="space-y-2">
              {attempts.map((a) => (
                <div key={a.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Attempt #{a.attemptNumber}</p>
                    <p className="text-sm text-slate-500">{a.score}/{a.totalMarks} ({a.percentage.toFixed(1)}%)</p>
                  </div>
                  <span className={`font-semibold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>{a.passed ? 'Pass' : 'Fail'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
