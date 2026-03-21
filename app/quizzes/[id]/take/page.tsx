'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

interface Option { id: string; option: string }
interface Question { id: string; question: string; questionImageUrl?: string | null; marks: number; options: Option[] }
interface Section { id: string; title: string; questions: Question[] }
interface Quiz { id: string; title: string; sections: Section[] }
interface ReviewItem {
  sectionId: string
  sectionTitle: string
  questionId: string
  question: string
  questionImageUrl?: string | null
  marks: number
  selectedOptionId: string | null
  correctOptionId: string | null
  options: { id: string; option: string }[]
  selectedAnswer: string | null
  correctAnswer: string | null
  isCorrect: boolean
  marksObtained: number
}

export default function TakeQuizPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const forceReattempt = searchParams.get('reattempt') === '1'

  useEffect(() => {
    if (!session) { router.push(`/login?callback=/quizzes/${id}/take`); return }

    const loadQuiz = async () => {
      try {
        // Auto-enroll if not enrolled
        await fetch(`/api/quizzes/${id}/enroll`, { method: 'POST' })
        const [quizRes, enrollmentRes] = await Promise.all([
          fetch(`/api/quizzes/${id}`),
          fetch(`/api/quizzes/${id}/enrollment`),
        ])
        if (quizRes.ok) setQuiz(await quizRes.json())
        if (enrollmentRes.ok) {
          const enrollmentData = await enrollmentRes.json()
          if (enrollmentData?.enrollment?.completedAt && !forceReattempt) {
            setResult({
              attemptNumber: enrollmentData.enrollment.attemptNumber,
              score: enrollmentData.enrollment.score || 0,
              totalMarks: enrollmentData.enrollment.totalMarks || 0,
              percentage: enrollmentData.enrollment.percentage || 0,
              passed: enrollmentData.passed ?? (enrollmentData.enrollment.percentage || 0) >= 50,
              review: enrollmentData.review || [],
            })
          }
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadQuiz()
  }, [id, session, router, forceReattempt])

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId })
  }

  const handleSubmit = async () => {
    if (!quiz) return
    const allQuestions = quiz.sections.flatMap((s) => s.questions)
    const unanswered = allQuestions.filter((q) => !answers[q.id])
    if (unanswered.length > 0 && !confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
        }),
      })
      if (res.ok) setResult(await res.json())
      else { const data = await res.json(); alert(data.error || 'Failed to submit') }
    } catch { alert('Failed to submit quiz') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
  if (!quiz) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500">Quiz not found</p></div>

  if (result) {
    const passed = result.percentage >= 50
    const reviewBySection = (result.review || []).reduce((acc: Record<string, ReviewItem[]>, item: ReviewItem) => {
      if (!acc[item.sectionTitle]) acc[item.sectionTitle] = []
      acc[item.sectionTitle].push(item)
      return acc
    }, {})
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-100">
            {passed ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{passed ? 'Congratulations!' : 'Keep Trying!'}</h1>
            <p className="text-slate-500 mb-6">{passed ? 'You passed the quiz!' : 'You did not pass this time.'}</p>
          {result.attemptNumber && (
            <p className="text-sm text-slate-500 mb-4">Attempt #{result.attemptNumber}</p>
          )}
            <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-sm text-slate-500">Score</p><p className="text-2xl font-bold text-primary">{result.score}/{result.totalMarks}</p></div>
                <div><p className="text-sm text-slate-500">Percentage</p><p className="text-2xl font-bold text-primary">{result.percentage.toFixed(1)}%</p></div>
                <div><p className="text-sm text-slate-500">Status</p><p className={`text-2xl font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>{passed ? 'Pass' : 'Fail'}</p></div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Link href="/quizzes" className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">All Quizzes</Link>
              <Link href={`/quizzes/${id}`} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light font-medium">Quiz Details</Link>
              <button
                onClick={() => {
                  setResult(null)
                  setAnswers({})
                }}
                className="px-6 py-3 bg-accent-orange text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                Re-attempt Now
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Answer Review</h2>
            {Object.entries(reviewBySection).map(([sectionTitle, items]) => (
              <div key={sectionTitle} className="mb-6 last:mb-0">
                <h3 className="font-semibold text-slate-700 mb-3">{sectionTitle}</h3>
                <div className="space-y-3">
                  {(items as ReviewItem[]).map((item, index) => (
                    <div key={item.questionId} className={`rounded-lg border p-4 ${item.isCorrect ? 'border-green-200 bg-green-50/60' : 'border-red-200 bg-red-50/60'}`}>
                      <p className="font-medium text-slate-800 mb-2">{index + 1}. {item.question}</p>
                      {item.questionImageUrl && (
                        <img
                          src={item.questionImageUrl}
                          alt="Question"
                          className="mb-3 max-h-64 w-auto rounded-lg border border-slate-200"
                        />
                      )}
                      <div className="space-y-2 my-3">
                        {item.options.map((opt, optIndex) => {
                          const isSelected = item.selectedOptionId === opt.id
                          const isCorrect = item.correctOptionId === opt.id
                          const isWrongSelected = isSelected && !isCorrect
                          return (
                            <div
                              key={opt.id}
                              className={`rounded-md border px-3 py-2 text-sm flex items-center justify-between ${
                                isCorrect
                                  ? 'border-green-300 bg-green-50'
                                  : isWrongSelected
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <span className="text-slate-700">
                                <span className="font-semibold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                {opt.option}
                              </span>
                              <div className="flex items-center gap-2 text-xs">
                                {isSelected && (
                                  <span className={`px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Your choice
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                                    Correct
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Your answer:</span>{' '}
                        <span className={item.isCorrect ? 'text-green-700' : 'text-red-700'}>{item.selectedAnswer || 'Not answered'}</span>
                      </p>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Correct answer:</span>{' '}
                        <span className="text-green-700">{item.correctAnswer || '-'}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Marks: {item.marksObtained}/{item.marks}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const allQuestions = quiz.sections.flatMap((s) => s.questions)
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/quizzes/${id}`} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-semibold text-slate-800 truncate">{quiz.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{answeredCount}/{allQuestions.length} answered</span>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-light font-medium disabled:opacity-50 text-sm">
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {quiz.sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">{section.title}</h2>
            <div className="space-y-6">
              {section.questions.map((question, qi) => (
                <div key={question.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">{qi + 1}</span>
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium">{question.question}</p>
                      {question.questionImageUrl && (
                        <img
                          src={question.questionImageUrl}
                          alt={`Question ${qi + 1}`}
                          className="mt-3 max-h-72 w-auto rounded-lg border border-slate-200"
                        />
                      )}
                      <p className="text-xs text-slate-400 mt-1">{question.marks} mark{question.marks > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-10">
                    {question.options.map((option) => (
                      <label key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          answers[question.id] === option.id
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}>
                        <input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id}
                          onChange={() => handleAnswer(question.id, option.id)} className="sr-only" />
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          answers[question.id] === option.id ? 'border-primary' : 'border-slate-300'
                        }`}>
                          {answers[question.id] === option.id && <span className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </span>
                        <span className="text-sm">{option.option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-center pt-4 pb-8">
          <button onClick={handleSubmit} disabled={submitting}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-light font-semibold disabled:opacity-50 shadow-sm">
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}
