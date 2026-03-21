'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Pencil } from 'lucide-react'

interface MockTest {
  id: string
  title: string
  durationMinutes: number
  isFree: boolean
  price: number
  isPublished: boolean
  _count?: { enrollments: number; attempts: number }
}

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/mock-tests')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setTests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const togglePublish = async (test: MockTest) => {
    const res = await fetch(`/api/admin/mock-tests/${test.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...test, isPublished: !test.isPublished }),
    })
    if (res.ok) load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this mock test?')) return
    const res = await fetch(`/api/admin/mock-tests/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Mock Tests</h1>
        <Link href="/admin/mock-tests/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light">
          <Plus className="w-4 h-4" /> Create Mock Test
        </Link>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-dark-900">
            <tr>
              <th className="px-4 py-3 text-gray-400 text-xs uppercase">Title</th>
              <th className="px-4 py-3 text-gray-400 text-xs uppercase">Duration</th>
              <th className="px-4 py-3 text-gray-400 text-xs uppercase">Type</th>
              <th className="px-4 py-3 text-gray-400 text-xs uppercase">Attempts</th>
              <th className="px-4 py-3 text-gray-400 text-xs uppercase">Status</th>
              <th className="px-4 py-3 text-gray-400 text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-5 text-gray-400" colSpan={6}>Loading...</td></tr>
            ) : tests.length === 0 ? (
              <tr><td className="px-4 py-5 text-gray-400" colSpan={6}>No mock tests created yet.</td></tr>
            ) : tests.map((test) => (
              <tr key={test.id} className="border-t border-dark-700">
                <td className="px-4 py-3 text-white">{test.title}</td>
                <td className="px-4 py-3 text-gray-300">{test.durationMinutes} min</td>
                <td className="px-4 py-3 text-gray-300">{test.isFree ? 'Free' : `Paid (INR ${test.price})`}</td>
                <td className="px-4 py-3 text-gray-300">{test._count?.attempts || 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${test.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {test.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/mock-tests/${test.id}/edit`} className="p-1 text-blue-400 hover:text-blue-300">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => togglePublish(test)} className="text-xs px-2 py-1 rounded border border-dark-600 text-gray-200 hover:bg-dark-700">
                      {test.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => remove(test.id)} className="p-1 text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
