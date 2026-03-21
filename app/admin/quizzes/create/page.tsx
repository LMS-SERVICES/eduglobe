'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'

interface OptionInput { id: string; option: string; order: number }
interface QuestionInput { question: string; questionImageUrl: string; correctOptionId: string; marks: number; order: number; options: OptionInput[] }
interface SectionInput { title: string; order: number; questions: QuestionInput[] }

let optionCounter = 0
const newOption = (): OptionInput => ({ id: `opt-${++optionCounter}`, option: '', order: optionCounter })
const newQuestion = (): QuestionInput => ({ question: '', questionImageUrl: '', correctOptionId: '', marks: 1, order: 0, options: [newOption(), newOption(), newOption(), newOption()] })
const QUIZ_DRAFT_KEY = 'admin-create-quiz-draft-v1'

export default function CreateQuizPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', details: '', thumbnail: '', price: 0, expiryDate: '', generateCertificate: false, isPublished: false })
  const [sections, setSections] = useState<SectionInput[]>([{ title: 'Section 1', order: 1, questions: [newQuestion()] }])
  const [currentStep, setCurrentStep] = useState(1)
  const [draftLoaded, setDraftLoaded] = useState(false)

  const steps = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Questions' },
    { id: 3, title: 'Review & Save' },
  ]

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_DRAFT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.form) setForm(parsed.form)
      if (parsed?.sections?.length) setSections(parsed.sections)
      if (parsed?.currentStep) setCurrentStep(parsed.currentStep)
      setDraftLoaded(true)
    } catch {
      // ignore malformed draft
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify({ form, sections, currentStep }))
  }, [form, sections, currentStep])

  const addSection = () => setSections([...sections, { title: `Section ${sections.length + 1}`, order: sections.length + 1, questions: [newQuestion()] }])
  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i))
  const addQuestion = (si: number) => { const u = [...sections]; u[si].questions.push(newQuestion()); setSections(u) }
  const removeQuestion = (si: number, qi: number) => { const u = [...sections]; u[si].questions = u[si].questions.filter((_, i) => i !== qi); setSections(u) }
  const addOption = (si: number, qi: number) => { const u = [...sections]; u[si].questions[qi].options.push(newOption()); setSections(u) }
  const removeOption = (si: number, qi: number, oi: number) => { const u = [...sections]; u[si].questions[qi].options = u[si].questions[qi].options.filter((_, i) => i !== oi); setSections(u) }

  const handleSubmit = async (e: React.FormEvent, forceDraft = false) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isPublished: forceDraft ? false : form.isPublished,
          expiryDate: form.expiryDate || null,
          sections: sections.map((s, si) => ({
            ...s, order: si + 1,
            questions: s.questions.map((q, qi) => ({ ...q, order: qi + 1, options: q.options.map((o, oi) => ({ ...o, order: oi })) })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create quiz'); return }
      localStorage.removeItem(QUIZ_DRAFT_KEY)
      router.push('/admin/quizzes')
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  const ic =
    'w-full px-4 py-2.5 border border-dark-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all duration-200 shadow-inner shadow-black/20'

  const clearDraft = () => {
    localStorage.removeItem(QUIZ_DRAFT_KEY)
    setForm({ title: '', description: '', details: '', thumbnail: '', price: 0, expiryDate: '', generateCertificate: false, isPublished: false })
    setSections([{ title: 'Section 1', order: 1, questions: [newQuestion()] }])
    setCurrentStep(1)
    setDraftLoaded(false)
    setError('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-white">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Quiz</h1>
          <p className="mt-1 text-gray-400">Add a new quiz to the platform</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Quiz Creation Wizard</p>
            <p className="text-xs text-gray-400">Step {currentStep} of {steps.length}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-primary/15 text-primary-300 border border-primary/30">
            {Math.round((currentStep / steps.length) * 100)}% complete
          </span>
        </div>
        <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gradient-primary transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        {draftLoaded && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
            <span className="text-sm">Draft restored. Continue from where you left off.</span>
            <button type="button" onClick={clearDraft} className="text-xs px-3 py-1 rounded border border-amber-500/40 hover:bg-amber-500/10">
              Clear Draft
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors text-left ${
                currentStep === step.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-dark-900 text-gray-300 border-dark-700 hover:border-primary/40'
              }`}
            >
              {step.id}. {step.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-8">
        {currentStep === 1 && (
        <div className="bg-dark-900/70 rounded-2xl border border-dark-700 p-6 md:p-8 space-y-5 shadow-xl">
          <h2 className="text-xl font-semibold text-white">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={ic} style={{ backgroundColor: '#0b1220' }} placeholder="Quiz title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={ic} style={{ backgroundColor: '#0b1220' }} rows={3} placeholder="Brief description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Details (shown on quiz page)</label>
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className={ic} style={{ backgroundColor: '#0b1220' }} rows={5} placeholder="Detailed instructions, rules, etc." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL</label>
              <input type="url" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className={ic} style={{ backgroundColor: '#0b1220' }} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price (₹)</label>
              <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={ic} style={{ backgroundColor: '#0b1220' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
              <input
                type="datetime-local"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className={`${ic} [color-scheme:dark]`}
                style={{ backgroundColor: '#0b1220' }}
              />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded border-dark-700" />
                Publish immediately
              </label>
            </div>
          </div>
        </div>
        )}

        {currentStep === 2 && (
        <div className="bg-dark-900/70 rounded-2xl border border-dark-700 p-6 md:p-8 space-y-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white">Sections & Questions</h2>
          {sections.map((section, si) => (
            <div key={si} className="border border-dark-600 rounded-xl p-4 md:p-5 space-y-4 bg-dark-950/60">
              <div className="flex items-center gap-2">
                <input type="text" value={section.title} onChange={(e) => { const u = [...sections]; u[si].title = e.target.value; setSections(u) }} className={ic} style={{ backgroundColor: '#0b1220' }} placeholder={`Section ${si + 1}`} />
                {sections.length > 1 && <button type="button" onClick={() => removeSection(si)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>}
              </div>

              {section.questions.map((q, qi) => (
                <div key={qi} className="ml-4 border-l-2 border-dark-600 pl-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">Question {qi + 1}</span>
                    {section.questions.length > 1 && <button type="button" onClick={() => removeQuestion(si, qi)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                  <textarea value={q.question} onChange={(e) => { const u = [...sections]; u[si].questions[qi].question = e.target.value; setSections(u) }} className={ic} style={{ backgroundColor: '#0b1220' }} rows={2} placeholder="Enter question" />
                  <input
                    type="url"
                    value={q.questionImageUrl}
                    onChange={(e) => { const u = [...sections]; u[si].questions[qi].questionImageUrl = e.target.value; setSections(u) }}
                    className={ic}
                    style={{ backgroundColor: '#0b1220' }}
                    placeholder="Question Image URL (optional, useful for math diagrams)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Marks</label>
                      <input
                        type="number"
                        min={1}
                        value={q.marks === 0 ? '' : q.marks}
                        onChange={(e) => {
                          const u = [...sections]
                          u[si].questions[qi].marks = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                          setSections(u)
                        }}
                        onBlur={() => {
                          const u = [...sections]
                          if (!u[si].questions[qi].marks || u[si].questions[qi].marks < 1) {
                            u[si].questions[qi].marks = 1
                            setSections(u)
                          }
                        }}
                        className={ic}
                        style={{ backgroundColor: '#0b1220' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Correct Answer</label>
                      <select value={q.correctOptionId} onChange={(e) => { const u = [...sections]; u[si].questions[qi].correctOptionId = e.target.value; setSections(u) }} className={`${ic} cursor-pointer`} style={{ backgroundColor: '#0b1220' }}>
                        <option value="">Select correct option</option>
                        {q.options.map((o, oi) => <option key={o.id} value={o.id}>Option {oi + 1}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={opt.id} className="flex gap-2 items-center">
                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${q.correctOptionId === opt.id ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-700 text-gray-400'}`}>{String.fromCharCode(65 + oi)}</span>
                        <input type="text" value={opt.option} onChange={(e) => { const u = [...sections]; u[si].questions[qi].options[oi].option = e.target.value; setSections(u) }} className={ic} style={{ backgroundColor: '#0b1220' }} placeholder={`Option ${oi + 1}`} />
                        {q.options.length > 2 && <button type="button" onClick={() => removeOption(si, qi, oi)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(si, qi)} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Add Option</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addQuestion(si)} className="ml-4 text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Question</button>
            </div>
          ))}
          <button type="button" onClick={addSection} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Section</button>
        </div>
        )}

        {currentStep === 3 && (
          <div className="bg-dark-900/70 rounded-2xl border border-dark-700 p-6 md:p-8 space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold text-white">Review & Save</h2>
            <p className="text-gray-300"><span className="text-gray-500">Title:</span> {form.title || '-'}</p>
            <p className="text-gray-300"><span className="text-gray-500">Price:</span> {form.price > 0 ? `INR ${form.price}` : 'Free'}</p>
            <p className="text-gray-300"><span className="text-gray-500">Sections:</span> {sections.length}</p>
            <p className="text-gray-300">
              <span className="text-gray-500">Questions:</span>{' '}
              {sections.reduce((sum, section) => sum + section.questions.length, 0)}
            </p>
            <p className="text-gray-300"><span className="text-gray-500">Status:</span> {form.isPublished ? 'Published' : 'Draft'}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/admin/quizzes" className="px-6 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700">Cancel</Link>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-6 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600"
            >
              Previous
            </button>
          )}
          {currentStep < 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light"
            >
              Next
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            className="px-6 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="submit" disabled={loading} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
            <Save className="w-5 h-5" /> {loading ? 'Creating...' : 'Create & Publish'}
          </button>
        </div>
      </form>
    </div>
  )
}
