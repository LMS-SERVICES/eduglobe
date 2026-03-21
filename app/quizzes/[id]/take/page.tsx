'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

interface Option { id: string; option: string }
interface Question { id: string; question: string; questionImageUrl?: string | null; marks: number; options: Option[] }
interface Section { id: string; title: string; questions: Question[] }
interface Quiz { id: string; title: string; sections: Section[] }

export default function TakeQuizPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (!session) { router.push(`/login?callback=/quizzes/${id}/take`); return }

    const loadQuiz = async () => {
      try {
        // Auto-enroll if not enrolled
        await fetch(`/api/quizzes/${id}/enroll`, { method: 'POST' })
        const res = await fetch(`/api/quizzes/${id}`)
        if (res.ok) setQuiz(await res.json())
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadQuiz()
  }, [id, session, router])

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
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-100">
          {passed ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{passed ? 'Congratulations!' : 'Keep Trying!'}</h1>
          <p className="text-slate-500 mb-6">{passed ? 'You passed the quiz!' : 'You did not pass this time.'}</p>
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
