'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toastError, toastSuccess, toastWarning } from '@/lib/toast'

interface Option { id: string; option: string }
interface Question { id: string; question: string; questionImageUrl?: string | null; marks: number; negativeMarks: number; options: Option[] }
interface Section { id: string; title: string; questions: Question[] }
interface MockTest { id: string; title: string; durationMinutes: number; sections: Section[] }

export default function TakeMockTestPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [test, setTest] = useState<MockTest | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [activeQuestionBySection, setActiveQuestionBySection] = useState<Record<string, number>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({})

  const forceReattempt = searchParams.get('reattempt') === '1'

  useEffect(() => {
    if (!session) {
      router.push(`/login?callback=/mock-test/${id}/take`)
      return
    }
    const load = async () => {
      try {
        await fetch(`/api/mock-tests/${id}/enroll`, { method: 'POST' })
        const [testRes, enrollRes] = await Promise.all([
          fetch(`/api/mock-tests/${id}`),
          fetch(`/api/mock-tests/${id}/enrollment`),
        ])
        if (testRes.ok) {
          const testData = await testRes.json()
          setTest(testData)
          setSecondsLeft((testData.durationMinutes || 0) * 60)
        }
        if (enrollRes.ok) {
          const eData = await enrollRes.json()
          if (eData?.latestAttempt && !forceReattempt) {
            setResult({
              attemptNumber: eData.latestAttempt.attemptNumber,
              score: eData.latestAttempt.score,
              totalMarks: eData.latestAttempt.totalMarks,
              percentage: eData.latestAttempt.percentage,
              passed: eData.latestAttempt.passed,
              review: eData.latestAttempt.review || [],
            })
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, session, router, forceReattempt])

  useEffect(() => {
    if (!test || result || submitting) return
    if (!testStarted) return
    if (secondsLeft <= 0) {
      handleSubmit()
      return
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, test, result, submitting, testStarted])

  useEffect(() => {
    if (!test) return
    const current = test.sections[activeSection]
    if (!current) return
    setActiveQuestionBySection((prev) => ({
      ...prev,
      [current.id]: prev[current.id] ?? 0,
    }))
    setVisitedQuestions((prev) => {
      const next = { ...prev }
      current.questions.forEach((q) => {
        next[q.id] = true
      })
      return next
    })
  }, [activeSection, test])

  useEffect(() => {
    if (!result) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined)
    }
  }, [result])

  useEffect(() => {
    if (!testStarted || !!result) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const isRefresh = key === 'f5' || ((e.ctrlKey || e.metaKey) && key === 'r')
      const isBack = (e.altKey && key === 'arrowleft') || (e.metaKey && key === '[')
      if (isRefresh || isBack) {
        e.preventDefault()
        toastWarning('Test in progress', 'Refresh and back navigation are disabled until you submit.')
      }
    }

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
      toastWarning('Test in progress', 'Use the sidebar to move between questions, or submit when finished.')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [testStarted, result])

  const allQuestions = useMemo(() => test?.sections.flatMap((s) => s.questions) || [], [test])
  const answeredCount = Object.keys(answers).length

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!test) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/mock-tests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: allQuestions.map((q) => ({
            questionId: q.id,
            optionId: answers[q.id] || null,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toastError('Could not submit', data.error || 'Please try again.')
        return
      }
      setResult(data)
      toastSuccess('Test submitted', 'Your score is shown below.')
    } catch {
      toastError('Could not submit', 'Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const startExamMode = async () => {
    setTestStarted(true)
    const root = document.documentElement
    if (root.requestFullscreen) {
      try {
        await root.requestFullscreen()
      } catch {
        // continue without fullscreen if browser blocks it
      }
    }
  }

  const statusForQuestion = (questionId: string): 'answered' | 'seen' | 'notVisited' => {
    if (answers[questionId]) return 'answered'
    if (visitedQuestions[questionId]) return 'seen'
    return 'notVisited'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
  if (!test) return <div className="min-h-screen flex items-center justify-center text-slate-500">Mock test not found</div>

  if (result) {
    const reviewBySection = (result.review || []).reduce((acc: Record<string, any[]>, item: any) => {
      if (!acc[item.sectionTitle]) acc[item.sectionTitle] = []
      acc[item.sectionTitle].push(item)
      return acc
    }, {})
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800">Mock Test Result</h1>
            <p className="text-slate-500 mt-1">Attempt #{result.attemptNumber}</p>
            <p className="mt-4 text-lg font-semibold text-primary">{result.score}/{result.totalMarks} ({result.percentage.toFixed(1)}%)</p>
            <p className={`font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>{result.passed ? 'Pass' : 'Fail'}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href={`/mock-test/${id}`} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Back to Mock Test</Link>
              <button onClick={() => { setResult(null); setAnswers({}); setVisitedQuestions({}); setSecondsLeft((test.durationMinutes || 0) * 60); setTestStarted(false) }} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light">Re-attempt</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Answer Review</h2>
            {Object.entries(reviewBySection).map(([sectionTitle, items]) => (
              <div key={sectionTitle} className="mb-5 last:mb-0">
                <h3 className="font-semibold text-slate-700 mb-2">{sectionTitle}</h3>
                <div className="space-y-3">
                  {(items as any[]).map((item, idx) => (
                    <div key={item.questionId} className={`border rounded-lg p-4 ${item.isCorrect ? 'border-green-200 bg-green-50/60' : 'border-red-200 bg-red-50/60'}`}>
                      <p className="font-medium text-slate-800 mb-2">{idx + 1}. {item.question}</p>
                      <div className="space-y-2">
                        {(item.options || []).map((opt: any, oi: number) => {
                          const isSelected = item.selectedOptionId === opt.id
                          const isCorrect = item.correctOptionId === opt.id
                          return (
                            <div key={opt.id} className={`px-3 py-2 rounded border text-sm ${isCorrect ? 'border-green-300 bg-green-50' : isSelected ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
                              <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt.option}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Marks: {item.marksObtained}/{item.marks} {item.negativeMarks ? `(Negative: -${item.negativeMarks})` : ''}</p>
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

  const currentSection = test.sections[activeSection]
  const currentQuestions = currentSection?.questions || []
  const activeQuestionIndex = Math.min(
    activeQuestionBySection[currentSection?.id] ?? 0,
    Math.max(0, currentQuestions.length - 1)
  )
  const currentQuestion = currentQuestions[activeQuestionIndex]
  const sectionAnswered = currentQuestions.filter((q) => !!answers[q.id]).length

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-800">{test.title}</h1>
          <p className="mt-2 text-slate-600">You are about to enter full exam mode.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-slate-500">Total Questions</p>
              <p className="font-semibold text-slate-800">{allQuestions.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-slate-500">Duration</p>
              <p className="font-semibold text-slate-800">{test.durationMinutes} minutes</p>
            </div>
          </div>
          <ul className="mt-5 text-sm text-slate-600 list-disc pl-5 space-y-1">
            <li>Timer starts immediately after entering exam mode.</li>
            <li>Use section panel to move between sections anytime.</li>
            <li>Question palette colors: answered (green), seen-not-attempted (red), not visited (gray).</li>
            <li>Full-screen exits automatically after submission.</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Link href={`/mock-test/${id}`} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</Link>
            <button onClick={startExamMode} className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-light">Start Mock Test</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">{test.title}</p>
            <p className="text-xs text-slate-500">Attempted: {answeredCount}/{allQuestions.length}</p>
          </div>
          <div className={`text-lg font-bold ${secondsLeft < 60 ? 'text-red-600' : 'text-primary'}`}>
            {formatTime(secondsLeft)}
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 py-6">
        <aside className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 h-fit">
          <h3 className="font-semibold text-slate-800 mb-3">Sections</h3>
          <div className="space-y-2">
            {test.sections.map((sec, idx) => {
              const attempted = sec.questions.filter((q) => !!answers[q.id]).length
              const seenNotAnswered = sec.questions.filter((q) => !answers[q.id] && visitedQuestions[q.id]).length
              const notVisited = sec.questions.filter((q) => !visitedQuestions[q.id]).length
              return (
                <div key={sec.id} className={`rounded-lg border ${activeSection === idx ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}>
                  <button onClick={() => setActiveSection(idx)} className={`w-full text-left px-3 py-2 rounded-lg ${activeSection === idx ? 'text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
                    <p className="font-medium">{sec.title}</p>
                    <p className="text-xs text-slate-500">{attempted}/{sec.questions.length} attempted</p>
                    <p className="text-[11px] mt-1">
                      <span className="text-green-600 font-medium">{attempted} answered</span>{' '}
                      <span className="text-red-600 font-medium">{seenNotAnswered} seen</span>{' '}
                      <span className="text-gray-500 font-medium">{notVisited} not visited</span>
                    </p>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Question Palette</h4>
            <div className="space-y-3">
              {test.sections.map((sec) => (
                <div key={sec.id}>
                  <p className="text-xs text-slate-600 mb-1">{sec.title}</p>
                  <div className="grid grid-cols-6 gap-1">
                    {sec.questions.map((q, index) => {
                      const status = statusForQuestion(q.id)
                      const bg =
                        status === 'answered'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : status === 'seen'
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            const targetSectionIndex = test.sections.findIndex((s) => s.id === sec.id)
                            if (targetSectionIndex >= 0) setActiveSection(targetSectionIndex)
                            setActiveQuestionBySection((prev) => ({ ...prev, [sec.id]: index }))
                          }}
                          className={`h-7 rounded border text-xs font-medium ${bg}`}
                          title={`Q${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-slate-500 space-y-1">
              <p><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" /> Answered</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> Seen, not attempted</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1" /> Not visited</p>
            </div>
          </div>
          <Link
            href={`/mock-test/${id}`}
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => undefined)
              }
            }}
            className="block mt-4 text-sm text-slate-500 hover:text-slate-700"
          >
            Exit test
          </Link>
        </aside>

        <main className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="font-semibold text-slate-800">{currentSection.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{sectionAnswered}/{currentQuestions.length} questions attempted</p>
          </div>
          {currentQuestion ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="font-medium text-slate-800">{activeQuestionIndex + 1}. {currentQuestion.question}</p>
              <p className="text-xs text-slate-500 mt-1">Marks: +{currentQuestion.marks} {currentQuestion.negativeMarks ? `| Negative: -${currentQuestion.negativeMarks}` : ''}</p>
              <div className="mt-3 space-y-2">
                {currentQuestion.options.map((opt, oi) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${answers[currentQuestion.id] === opt.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      checked={answers[currentQuestion.id] === opt.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.id }))}
                    />
                    <span className="text-sm text-slate-700"><span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt.option}</span>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (activeQuestionIndex > 0) {
                      setActiveQuestionBySection((prev) => ({ ...prev, [currentSection.id]: activeQuestionIndex - 1 }))
                      return
                    }
                    if (activeSection > 0) {
                      const prevSection = test.sections[activeSection - 1]
                      setActiveSection(activeSection - 1)
                      setActiveQuestionBySection((prev) => ({
                        ...prev,
                        [prevSection.id]: Math.max(0, prevSection.questions.length - 1),
                      }))
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Previous Question
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeQuestionIndex < currentQuestions.length - 1) {
                      setActiveQuestionBySection((prev) => ({ ...prev, [currentSection.id]: activeQuestionIndex + 1 }))
                      return
                    }
                    if (activeSection < test.sections.length - 1) {
                      const nextSection = test.sections[activeSection + 1]
                      setActiveSection(activeSection + 1)
                      setActiveQuestionBySection((prev) => ({ ...prev, [nextSection.id]: 0 }))
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light"
                >
                  Next Question
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-500">No questions in this section.</div>
          )}
        </main>
      </div>
    </div>
  )
}
