'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Users } from 'lucide-react'
import Link from 'next/link'
import { toastError, toastSuccess } from '@/lib/toast'

interface Quiz {
  id: string
  title: string
  price: number
  isPublished: boolean
  expiryDate?: string | null
  _count: { enrollments: number }
  sections: { questions: any[] }[]
  createdAt: string
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetch('/api/admin/quizzes')
      .then((r) => r.ok ? r.json() : [])
      .then(setQuizzes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setQuizzes(quizzes.filter((q) => q.id !== id))
        toastSuccess('Quiz deleted', 'The quiz has been removed.')
      } else {
        toastError('Could not delete quiz', data.error || 'Please try again.')
      }
    } catch {
      toastError('Could not delete quiz', 'Check your connection and try again.')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setQuizzes(quizzes.map((q) => q.id === id ? { ...q, isPublished: !currentStatus } : q))
        toastSuccess(
          currentStatus ? 'Quiz unpublished' : 'Quiz published',
          currentStatus ? 'It is hidden from learners.' : 'It is visible in the catalog.'
        )
      } else {
        toastError('Could not update quiz', data.error || 'Please try again.')
      }
    } catch {
      toastError('Could not update quiz', 'Check your connection and try again.')
    }
  }

  const getQuestionCount = (quiz: Quiz) => quiz.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0

  const filteredQuizzes = quizzes.filter((q) => q.title.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Quizzes Management</h1>
          <p className="mt-2 text-gray-400">Manage all quizzes in the platform</p>
        </div>
        <Link href="/admin/quizzes/create" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-all">
          <Plus className="w-5 h-5" /> Add New Quiz
        </Link>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search quizzes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700">
            <thead className="bg-dark-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Enrollments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredQuizzes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No quizzes found.</td></tr>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-dark-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{quiz.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{getQuestionCount(quiz)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{quiz.price > 0 ? `₹${quiz.price}` : 'Free'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{quiz._count.enrollments}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${quiz.isPublished ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)} className="text-gray-400 hover:text-primary-400" title={quiz.isPublished ? 'Unpublish' : 'Publish'}>
                          {quiz.isPublished ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <Link href={`/admin/quizzes/${quiz.id}/enrollments`} className="text-blue-400 hover:text-blue-300" title="Enrollments"><Users className="w-5 h-5" /></Link>
                        <Link href={`/admin/quizzes/${quiz.id}/edit`} className="text-primary-400 hover:text-primary-300" title="Edit"><Edit className="w-5 h-5" /></Link>
                        <button onClick={() => handleDelete(quiz.id)} className="text-red-400 hover:text-red-300" title="Delete"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><p className="text-sm text-gray-400">Total Quizzes</p><p className="text-2xl font-bold text-white">{quizzes.length}</p></div>
          <div><p className="text-sm text-gray-400">Published</p><p className="text-2xl font-bold text-green-400">{quizzes.filter((q) => q.isPublished).length}</p></div>
          <div><p className="text-sm text-gray-400">Drafts</p><p className="text-2xl font-bold text-gray-400">{quizzes.filter((q) => !q.isPublished).length}</p></div>
        </div>
      </div>
    </div>
  )
}
