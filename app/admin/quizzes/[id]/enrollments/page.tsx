'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Enrollment {
  id: string
  enrolledAt: string
  completedAt: string | null
  score: number | null
  totalMarks: number | null
  percentage: number | null
  user: { id: string; name: string | null; email: string }
  quiz: { title: string }
}

export default function QuizEnrollmentsPage() {
  const { id } = useParams()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/quizzes/${id}/enrollments`)
      .then((r) => r.ok ? r.json() : [])
      .then(setEnrollments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const completed = enrollments.filter((e) => e.completedAt)
  const avgScore = completed.length > 0 ? completed.reduce((sum, e) => sum + (e.percentage || 0), 0) / completed.length : 0

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Quiz Enrollments</h1>
          <p className="mt-1 text-gray-400">{enrollments[0]?.quiz?.title || 'Quiz'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <p className="text-sm text-gray-400">Total</p><p className="text-2xl font-bold text-white">{enrollments.length}</p>
        </div>
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <p className="text-sm text-gray-400">Completed</p><p className="text-2xl font-bold text-green-400">{completed.length}</p>
        </div>
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <p className="text-sm text-gray-400">Pending</p><p className="text-2xl font-bold text-yellow-400">{enrollments.length - completed.length}</p>
        </div>
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <p className="text-sm text-gray-400">Avg Score</p><p className="text-2xl font-bold text-blue-400">{avgScore.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700">
            <thead className="bg-dark-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {enrollments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No enrollments yet.</td></tr>
              ) : (
                enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-dark-900">
                    <td className="px-6 py-4 text-sm text-white">{e.user.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{e.user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${e.completedAt ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {e.completedAt ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{e.completedAt ? `${e.score}/${e.totalMarks}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-white">{e.percentage != null ? `${e.percentage.toFixed(1)}%` : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
