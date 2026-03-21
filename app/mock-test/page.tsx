'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MockTest {
  id: string
  title: string
  description?: string
  durationMinutes: number
  isFree: boolean
  price: number
  sections: { questions: any[] }[]
  _count?: { enrollments: number; attempts: number }
}

export default function MockTestPage() {
  const [tests, setTests] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/mock-tests')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">Mock Tests</h1>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Real exam-like interface with timer, section navigation, and attempt history.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading mock tests...</p>
        ) : tests.length === 0 ? (
          <p className="text-slate-500">No mock tests available right now.</p>
        ) : (
          tests.map((test) => (
            <div key={test.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-primary-dark">{test.title}</h2>
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{test.description || 'No description added.'}</p>
              <p className="mt-2 text-sm text-slate-600">Duration: {test.durationMinutes} minutes</p>
              <p className="text-sm text-slate-600">
                Questions: {test.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)}
              </p>
              <p className="text-sm text-slate-600">Attempts: {test._count?.attempts || 0}</p>
              <span className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${test.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {test.isFree ? 'Free Mock' : `Paid (INR ${test.price})`}
              </span>
              <Link
                href={`/mock-test/${test.id}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90"
              >
                Start Mock Test
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
