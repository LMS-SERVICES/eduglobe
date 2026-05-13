'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
import { uploadFileToApi } from '@/lib/upload-client'

type Option = { option: string; imageUrl: string }
type Question = { question: string; questionImageUrl: string; marks: number; negativeMarks: number; correctOptionIndex: number; options: Option[] }
type Section = { title: string; questions: Question[] }
type FormState = {
  title: string
  description: string
  instructions: string
  thumbnail: string
  durationMinutes: number
  isFree: boolean
  price: number
  isPublished: boolean
}

const newQuestion = (): Question => ({
  question: '',
  questionImageUrl: '',
  marks: 1,
  negativeMarks: 0,
  correctOptionIndex: 0,
  options: [{ option: '', imageUrl: '' }, { option: '', imageUrl: '' }, { option: '', imageUrl: '' }, { option: '', imageUrl: '' }],
})

export default function EditMockTestPage() {
  const { id } = useParams()
  const router = useRouter()
  const draftKey = useMemo(() => `admin-edit-mock-test-draft-${id}`, [id])
  const [loading, setLoading] = useState(false)
  const [bootLoading, setBootLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingQuestionImg, setUploadingQuestionImg] = useState<string | null>(null)
  const [uploadingOptionImg, setUploadingOptionImg] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    instructions: '',
    thumbnail: '',
    durationMinutes: 150,
    isFree: true,
    price: 0,
    isPublished: false,
  })
  const [sections, setSections] = useState<Section[]>([{ title: 'Section 1', questions: [newQuestion()] }])

  const steps = [
    { id: 1, title: 'Basic Details' },
    { id: 2, title: 'Sections & Questions' },
    { id: 3, title: 'Review & Update' },
  ]

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/mock-tests/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load mock test')

        const mappedSections: Section[] = (data.sections || []).map((s: any) => ({
          title: s.title || '',
          questions: (s.questions || []).map((q: any) => ({
            question: q.question || '',
            questionImageUrl: q.questionImageUrl || '',
            marks: Number(q.marks || 1),
            negativeMarks: Number(q.negativeMarks || 0),
            correctOptionIndex: Math.max(0, (q.options || []).findIndex((o: any) => o.id === q.correctOptionId)),
            options: (q.options || []).map((o: any) => ({ option: o.option || '', imageUrl: o.imageUrl || '' })),
          })),
        }))

        setForm({
          title: data.title || '',
          description: data.description || '',
          instructions: data.instructions || '',
          thumbnail: data.thumbnail || '',
          durationMinutes: Number(data.durationMinutes || 150),
          isFree: !!data.isFree,
          price: Number(data.price || 0),
          isPublished: !!data.isPublished,
        })
        setSections(mappedSections.length ? mappedSections : [{ title: 'Section 1', questions: [newQuestion()] }])

        try {
          const raw = localStorage.getItem(draftKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.form) setForm(parsed.form)
            if (parsed?.sections?.length) setSections(parsed.sections)
            if (parsed?.currentStep) setCurrentStep(parsed.currentStep)
            setDraftLoaded(true)
          }
        } catch {
          // ignore malformed draft
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load mock test')
      } finally {
        setBootLoading(false)
      }
    }
    load()
  }, [id, draftKey])

  useEffect(() => {
    if (bootLoading) return
    localStorage.setItem(draftKey, JSON.stringify({ form, sections, currentStep }))
  }, [form, sections, currentStep, draftKey, bootLoading])

  const clearDraft = () => {
    localStorage.removeItem(draftKey)
    setDraftLoaded(false)
  }

  const validateStep = (step: number) => {
    if (step === 1) return form.title.trim().length > 0 && form.durationMinutes > 0
    if (step === 2) {
      return sections.length > 0 && sections.every((s) =>
        s.title.trim() &&
        s.questions.length > 0 &&
        s.questions.every((q) => q.question.trim() && q.options.every((o) => o.option.trim() || o.imageUrl.trim()))
      )
    }
    return true
  }

  const update = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateStep(1) || !validateStep(2)) {
      setError('Please complete all required fields before updating.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/mock-tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sections }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      localStorage.removeItem(draftKey)
      router.push('/admin/mock-tests')
    } catch (e: any) {
      setError(e.message || 'Failed to update mock test')
    } finally {
      setLoading(false)
    }
  }

  if (bootLoading) {
    return <div className="min-h-[320px] flex items-center justify-center text-gray-400">Loading mock test...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Edit Mock Test</h1>
        <Link href="/admin/mock-tests" className="px-4 py-2 rounded-lg border border-dark-600 text-gray-200 hover:bg-dark-800">Back</Link>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Mock Test Edit Wizard</p>
            <p className="text-xs text-gray-400">Step {currentStep} of {steps.length}</p>
          </div>
          <button type="button" onClick={clearDraft} className="text-xs px-3 py-1 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10">Clear Draft</button>
        </div>
        {draftLoaded && <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">Draft restored for this mock test.</div>}
        <div className="grid grid-cols-3 gap-2">
          {steps.map((step) => (
            <button key={step.id} type="button" onClick={() => setCurrentStep(step.id)} className={`px-3 py-2 rounded-lg text-sm border text-left ${currentStep === step.id ? 'bg-primary text-white border-primary' : 'bg-dark-900 text-gray-300 border-dark-700 hover:border-primary/40'}`}>
              {step.id}. {step.title}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={update} className="space-y-6">
        {currentStep === 1 && (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Details</h2>
            <input className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instructions</label>
              <RichTextEditor
                value={form.instructions}
                onChange={(value) => setForm({ ...form, instructions: value })}
                placeholder="Write exam instructions, rules, and important notes..."
                minHeightClassName="min-h-[220px]"
              />
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value || 0) })} placeholder="Duration (min)" />
              <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" min={0} value={form.price} disabled={form.isFree} onChange={(e) => setForm({ ...form, price: Number(e.target.value || 0) })} placeholder="Price" />
              <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price })} /> Free Mock</label>
              <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail (optional)</label>
              <p className="text-xs text-gray-500 mb-2">Upload an image, or paste a link below.</p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
                      .then(({ url }) => setForm((p) => ({ ...p, thumbnail: url })))
                      .catch((err: any) => setError(err?.message || 'Thumbnail upload failed'))
                    e.currentTarget.value = ''
                  }}
                  className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light"
                />
              </div>
              <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste image link instead</summary>
                <input
                  className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white"
                  placeholder="https://…"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                />
              </details>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Sections & Questions</h2>
            {sections.map((section, si) => (
              <div key={si} className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-4">
                <input className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={section.title} onChange={(e) => {
                  const u = [...sections]
                  u[si].title = e.target.value
                  setSections(u)
                }} placeholder={`Section ${si + 1}`} />
                {section.questions.map((q, qi) => (
                  <div key={qi} className="border border-dark-700 rounded-lg p-4 space-y-3">
                    <textarea className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={q.question} onChange={(e) => {
                      const u = [...sections]
                      u[si].questions[qi].question = e.target.value
                      setSections(u)
                    }} placeholder={`Question ${qi + 1}`} />
                    <p className="text-xs text-gray-400 mb-1">Question image (optional)</p>
                    <p className="text-[11px] text-gray-500 mb-1">Upload an image, or paste a link below.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingQuestionImg !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const key = `${si}-${qi}`
                          setUploadingQuestionImg(key)
                          uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
                            .then(({ url }) => {
                              const u = [...sections]
                              u[si].questions[qi].questionImageUrl = url
                              setSections(u)
                            })
                            .catch((err: any) => setError(err?.message || 'Question image upload failed'))
                            .finally(() => setUploadingQuestionImg(null))
                          e.currentTarget.value = ''
                        }}
                        className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary/90 file:text-white hover:file:bg-primary disabled:opacity-60"
                      />
                      {uploadingQuestionImg === `${si}-${qi}` && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>
                      )}
                    </div>
                    <details className="mt-2 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste image link instead</summary>
                      <input
                        className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white"
                        value={q.questionImageUrl}
                        onChange={(e) => {
                          const u = [...sections]
                          u[si].questions[qi].questionImageUrl = e.target.value
                          setSections(u)
                        }}
                        placeholder="https://…"
                      />
                    </details>
                    <div className="grid md:grid-cols-3 gap-3">
                      <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" value={q.marks} onChange={(e) => { const u = [...sections]; u[si].questions[qi].marks = Number(e.target.value || 0); setSections(u) }} placeholder="Marks" />
                      <input className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" type="number" value={q.negativeMarks} onChange={(e) => { const u = [...sections]; u[si].questions[qi].negativeMarks = Number(e.target.value || 0); setSections(u) }} placeholder="Negative marks" />
                      <select className="px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={q.correctOptionIndex} onChange={(e) => { const u = [...sections]; u[si].questions[qi].correctOptionIndex = Number(e.target.value); setSections(u) }}>
                        {q.options.map((_, oi) => <option key={oi} value={oi}>Correct: Option {oi + 1}</option>)}
                      </select>
                    </div>
                    {q.options.map((opt, oi) => {
                      const uploadKey = `${si}-${qi}-${oi}`
                      return (
                        <div key={oi} className="rounded-lg border border-dark-700 bg-dark-900/50 p-3 space-y-2">
                          <input className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white" value={opt.option} onChange={(e) => {
                            const u = [...sections]
                            u[si].questions[qi].options[oi].option = e.target.value
                            setSections(u)
                          }} placeholder={`Option ${oi + 1} text (optional if image uploaded)`} />
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingOptionImg !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setUploadingOptionImg(uploadKey)
                                uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
                                  .then(({ url }) => {
                                    const u = [...sections]
                                    u[si].questions[qi].options[oi].imageUrl = url
                                    setSections(u)
                                  })
                                  .catch((err: any) => setError(err?.message || 'Option image upload failed'))
                                  .finally(() => setUploadingOptionImg(null))
                                e.currentTarget.value = ''
                              }}
                              className="block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/90 file:text-white hover:file:bg-primary disabled:opacity-60"
                            />
                            {uploadingOptionImg === uploadKey && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>}
                          </div>
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt="" className="max-h-36 rounded-lg border border-dark-600 bg-dark-900 object-contain" />
                          )}
                          <details className="rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste option image link instead</summary>
                            <input
                              className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded text-white"
                              value={opt.imageUrl}
                              onChange={(e) => {
                                const u = [...sections]
                                u[si].questions[qi].options[oi].imageUrl = e.target.value
                                setSections(u)
                              }}
                              placeholder="https://…"
                            />
                          </details>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  const u = [...sections]
                  u[si].questions.push(newQuestion())
                  setSections(u)
                }} className="px-3 py-2 rounded border border-dark-600 text-gray-200 hover:bg-dark-700">Add Question</button>
              </div>
            ))}
            <button type="button" onClick={() => setSections([...sections, { title: `Section ${sections.length + 1}`, questions: [newQuestion()] }])} className="px-3 py-2 rounded border border-dark-600 text-gray-200 hover:bg-dark-700">Add Section</button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-3 text-gray-200">
            <h2 className="text-xl font-semibold text-white">Review & Update</h2>
            <p><span className="text-gray-400">Title:</span> {form.title || '-'}</p>
            <p><span className="text-gray-400">Duration:</span> {form.durationMinutes} minutes</p>
            <p><span className="text-gray-400">Type:</span> {form.isFree ? 'Free' : `Paid (INR ${form.price})`}</p>
            <p><span className="text-gray-400">Sections:</span> {sections.length}</p>
            <p><span className="text-gray-400">Questions:</span> {sections.reduce((sum, s) => sum + s.questions.length, 0)}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          {currentStep > 1 ? (
            <button type="button" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} className="px-4 py-2 rounded-lg border border-dark-600 text-gray-200 hover:bg-dark-800">Previous</button>
          ) : <div />}
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => {
                setError('')
                if (!validateStep(currentStep)) {
                  setError('Please fill required fields in this step before continuing.')
                  return
                }
                setCurrentStep((s) => Math.min(steps.length, s + 1))
              }}
              className="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-light"
            >
              Next
            </button>
          ) : (
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Mock Test'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
