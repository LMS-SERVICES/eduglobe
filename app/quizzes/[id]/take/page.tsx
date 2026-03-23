'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { toastError, toastSuccess } from '@/lib/toast'

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
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const forceReattempt = searchParams.get('reattempt') === '1'
  const isEmbed =
    searchParams.get('embed') === '1' || (pathname?.startsWith('/embed/quizzes/') ?? false)

  useEffect(() => {
    if (!session) {
      const quizId = typeof id === 'string' ? id : id?.[0]
      const takePath =
        pathname?.startsWith('/embed/quizzes/') && quizId
          ? `/embed/quizzes/${quizId}/take`
          : `/quizzes/${quizId}/take`
      router.push(`/login?callback=${encodeURIComponent(takePath)}`)
      return
    }

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
  }, [id, session, router, forceReattempt, pathname])

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
      if (res.ok) {
        const payload = await res.json()
        setResult(payload)
        toastSuccess('Quiz submitted', 'Your results are shown below.')
      } else {
        const data = await res.json().catch(() => ({}))
        toastError('Could not submit quiz', data.error || 'Please try again.')
      }
    } catch {
      toastError('Could not submit quiz', 'Check your connection and try again.')
    }
    finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <div
        className={
          isEmbed
            ? 'flex min-h-[40vh] flex-1 items-center justify-center bg-slate-50'
            : 'min-h-screen flex items-center justify-center bg-slate-50'
        }
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }
  if (!quiz) {
    return (
      <div
        className={
          isEmbed
            ? 'flex min-h-[24vh] flex-1 items-center justify-center bg-slate-50 px-4'
            : 'min-h-screen flex items-center justify-center bg-slate-50'
        }
      >
        <p className="text-slate-500">Quiz not found</p>
      </div>
    )
  }

  if (result) {
    const passed = result.percentage >= 50
    const reviewBySection = (result.review || []).reduce((acc: Record<string, ReviewItem[]>, item: ReviewItem) => {
      if (!acc[item.sectionTitle]) acc[item.sectionTitle] = []
      acc[item.sectionTitle].push(item)
      return acc
    }, {})
    return (
      <div
        className={
          isEmbed
            ? 'flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-white px-3 py-4'
            : 'min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10'
        }
      >
        <div
          className={`mx-auto w-full flex-1 space-y-6 ${isEmbed ? 'max-w-6xl' : 'max-w-4xl'}`}
        >
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
            <div className={`flex gap-4 justify-center ${isEmbed ? 'flex-wrap' : ''}`}>
              {!isEmbed && (
                <Link href="/quizzes" className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
                  All Quizzes
                </Link>
              )}
              {!isEmbed && (
                <Link href={`/quizzes/${id}`} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light font-medium">
                  Quiz Details
                </Link>
              )}
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

  const shellMax = isEmbed ? 'max-w-6xl' : 'max-w-4xl'
  const shellPadX = isEmbed ? 'px-4 sm:px-6' : 'px-4 sm:px-5'
  const shellPadY = isEmbed ? 'py-5 sm:py-7' : 'py-8'

  return (
    <div
      className={
        isEmbed
          ? 'flex min-h-screen flex-1 flex-col bg-slate-100'
          : 'min-h-screen bg-slate-100'
      }
    >
      <header className="sticky top-0 z-10 shrink-0 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-sm">
        <div
          className={`mx-auto flex w-full ${shellMax} flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${shellPadX} py-3.5 sm:py-4`}
        >
          <div className="flex min-w-0 items-center gap-3">
            {!isEmbed && (
              <Link
                href={`/quizzes/${id}`}
                className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
                aria-label="Back to quiz"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quiz</p>
              <h1 className="truncate text-base font-semibold leading-tight text-slate-900 sm:text-lg">
                {quiz.title}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {answeredCount}/{allQuestions.length} answered
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit quiz'}
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto w-full ${shellMax} space-y-8 ${shellPadX} ${shellPadY} pb-10`}>
          {quiz.sections.map((section) => (
            <section key={section.id} className="space-y-5">
              <div className="border-l-4 border-primary pl-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{section.title}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {section.questions.length} question{section.questions.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="space-y-5">
                {section.questions.map((question, qi) => (
                  <article
                    key={question.id}
                    className="w-full rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="mb-5 flex gap-4">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm"
                        aria-hidden
                      >
                        {qi + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-snug text-slate-900 sm:text-[1.05rem] sm:leading-relaxed">
                          {question.question}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          {question.marks} mark{question.marks > 1 ? 's' : ''}
                        </p>
                        {question.questionImageUrl && (
                          <img
                            src={question.questionImageUrl}
                            alt=""
                            className="mt-4 max-h-72 w-full max-w-2xl rounded-xl border border-slate-200 object-contain"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      {question.options.map((option, optIndex) => {
                        const selected = answers[question.id] === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex w-full cursor-pointer items-start gap-3.5 rounded-xl border-2 p-3.5 transition-all sm:p-4 ${
                              selected
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option.id}
                              checked={selected}
                              onChange={() => handleAnswer(question.id, option.id)}
                              className="sr-only"
                            />
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                selected ? 'border-primary bg-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </span>
                            <span className="min-w-0 flex-1 text-sm leading-relaxed text-slate-800 sm:text-[0.9375rem]">
                              <span className="mr-2 font-semibold tabular-nums text-slate-400">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              {option.option}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {!isEmbed && (
            <div className="flex justify-center border-t border-slate-200/80 pt-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-primary px-10 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit quiz'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
