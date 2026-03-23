'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, CheckCircle, Clock } from 'lucide-react'
import RazorpayCheckout from '@/components/RazorpayCheckout'
import { toastError, toastSuccess } from '@/lib/toast'

interface Quiz {
  id: string
  title: string
  description?: string
  details?: string
  thumbnail?: string
  price: number
  expiryDate?: string | null
  sections: { id: string; title: string; questions: any[] }[]
  _count: { enrollments: number }
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

export default function QuizDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/quizzes/${id}`).then((r) => r.ok ? r.json() : null),
      session ? fetch(`/api/quizzes/${id}/enrollment`).then((r) => r.ok ? r.json() : null) : null,
      session ? fetch(`/api/quizzes/${id}/attempts`).then((r) => r.ok ? r.json() : { attempts: [] }) : { attempts: [] },
    ]).then(([quizData, enrollData, attemptsData]) => {
      setQuiz(quizData)
      setEnrollment(enrollData)
      setAttempts(attemptsData?.attempts || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [id, session])

  const handleEnroll = async () => {
    if (!session) { router.push(`/login?callback=/quizzes/${id}`); return }
    setEnrolling(true)
    try {
      const res = await fetch(`/api/quizzes/${id}/enroll`, { method: 'POST' })
      if (res.ok) {
        toastSuccess('Ready to start', 'Opening the quiz…')
        router.push(`/quizzes/${id}/take`)
      } else {
        const data = await res.json().catch(() => ({}))
        toastError('Could not enroll', data.error || 'Please try again.')
      }
    } catch {
      toastError('Could not enroll', 'Check your connection and try again.')
    }
    finally { setEnrolling(false) }
  }

  const getQuestionCount = () => quiz?.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
  if (!quiz) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Not Found</h2><Link href="/quizzes" className="text-primary">Browse all quizzes</Link></div></div>

  const isCompleted = enrollment?.enrolled && enrollment?.enrollment?.completedAt

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/quizzes" className="inline-flex items-center text-white/80 hover:text-white mb-6 text-sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes</Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{quiz.title}</h1>
              {quiz.description && <p className="text-white/80 text-lg mb-6">{quiz.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {quiz._count.enrollments} enrolled</span>
                <span>{getQuestionCount()} questions</span>
                <span>{quiz.sections.length} sections</span>
                {quiz.expiryDate && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Expires: {new Date(quiz.expiryDate).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 text-slate-800">
                {quiz.thumbnail && (
                  <div className="relative h-32 rounded-lg overflow-hidden mb-4 bg-slate-100">
                    <Image src={quiz.thumbnail} alt={quiz.title} fill className="object-cover" sizes="400px" />
                  </div>
                )}
                <div className="mb-4">
                  {enrollment?.freeViaCourse && quiz.price > 0 && !enrollment?.enrolled ? (
                    <div>
                      <span className="text-lg text-slate-400 line-through">₹{quiz.price}</span>
                      <p className="text-base font-semibold text-green-700 mt-1">Included with your course</p>
                      <p className="text-xs text-slate-500 mt-1">No separate quiz payment required.</p>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-primary">{quiz.price > 0 ? `₹${quiz.price}` : 'Free'}</span>
                  )}
                </div>
                {isCompleted ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-700">Completed!</p>
                      <p className="text-sm text-green-600">Score: {enrollment.enrollment.score}/{enrollment.enrollment.totalMarks} ({enrollment.enrollment.percentage?.toFixed(1)}%)</p>
                    </div>
                    <Link href={`/quizzes/${id}/take`} className="block w-full py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-center font-medium">
                      View Answers
                    </Link>
                    <Link href={`/quizzes/${id}/take?reattempt=1`} className="block w-full py-2.5 bg-accent-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-center font-medium">
                      Re-attempt Quiz
                    </Link>
                  </div>
                ) : enrollment?.enrolled ? (
                  <Link href={`/quizzes/${id}/take`} className="block w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-center">
                    Continue Quiz
                  </Link>
                ) : quiz.price > 0 && !enrollment?.freeViaCourse ? (
                  <RazorpayCheckout
                    entityType="quiz"
                    entityId={quiz.id}
                    title={quiz.title}
                    price={quiz.price}
                    onSuccess={() => router.push(`/quizzes/${id}/take`)}
                    className="w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Enroll Now
                  </RazorpayCheckout>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling} className="w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50">
                    {enrolling
                      ? 'Enrolling...'
                      : enrollment?.freeViaCourse && quiz.price > 0
                        ? 'Start quiz (from your course)'
                        : 'Start Quiz'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {quiz.details && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Quiz Details</h2>
            <div className="prose prose-slate max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: quiz.details }} />
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Sections</h2>
          <div className="space-y-3">
            {quiz.sections.map((section, i) => (
              <div key={section.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-medium text-slate-800">{section.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{section.questions.length} questions</p>
              </div>
            ))}
          </div>
        </div>

        {attempts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Attempt History</h2>
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Attempt #{attempt.attemptNumber}</p>
                    <p className="text-sm text-slate-500">
                      Score: {attempt.score}/{attempt.totalMarks} ({attempt.percentage.toFixed(1)}%) · {new Date(attempt.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {attempt.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
