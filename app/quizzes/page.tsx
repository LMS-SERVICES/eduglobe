'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Clock, Users } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description?: string
  thumbnail?: string
  price: number
  expiryDate?: string | null
  isPublished: boolean
  sections: { questions: any[] }[]
  _count: { enrollments: number }
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/quizzes')
      .then((r) => r.ok ? r.json() : [])
      .then(setQuizzes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getQuestionCount = (quiz: Quiz) => quiz.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0

  const filteredQuizzes = quizzes.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-primary py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Quizzes</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Test your knowledge with our comprehensive quizzes on various subjects.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-20"><p className="text-slate-500 text-lg">No quizzes available yet. Check back soon!</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Link key={quiz.id} href={`/quizzes/${quiz.id}`}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                {quiz.thumbnail && (
                  <div className="relative h-40 bg-slate-100">
                    <Image src={quiz.thumbnail} alt={quiz.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800 text-lg mb-2 group-hover:text-primary transition-colors">{quiz.title}</h3>
                  {quiz.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{quiz.description}</p>}
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {quiz._count.enrollments} enrolled</span>
                    <span>{getQuestionCount(quiz)} questions</span>
                  </div>
                  {quiz.expiryDate && (
                    <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                      <Clock className="w-4 h-4" />
                      Expires: {new Date(quiz.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{quiz.price > 0 ? `₹${quiz.price}` : 'Free'}</span>
                    <span className="text-sm text-primary font-medium">Take Quiz →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
