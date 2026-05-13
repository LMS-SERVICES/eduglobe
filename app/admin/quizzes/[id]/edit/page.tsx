'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
import { uploadFileToApi } from '@/lib/upload-client'

type QuizOption = { id: string; option: string; imageUrl: string; order: number }
type QuizQuestion = {
  question: string
  questionImageUrl: string
  correctOptionId: string
  marks: number
  order: number
  options: QuizOption[]
}
type QuizSection = { title: string; order: number; questions: QuizQuestion[] }

export default function EditQuizPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingQuestionImg, setUploadingQuestionImg] = useState<string | null>(null)
  const [uploadingOptionImg, setUploadingOptionImg] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', details: '', thumbnail: '', price: 0, expiryDate: '', generateCertificate: false, isPublished: false })
  const [sections, setSections] = useState<QuizSection[]>([])

  useEffect(() => {
    fetch(`/api/admin/quizzes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          details: data.details || '',
          thumbnail: data.thumbnail || '',
          price: data.price || 0,
          expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().slice(0, 16) : '',
          generateCertificate: data.generateCertificate || false,
          isPublished: data.isPublished || false,
        })
        setSections((data.sections || []).map((s: any, si: number) => ({
          title: s.title || `Section ${si + 1}`,
          order: Number(s.order || si + 1),
          questions: (s.questions || []).map((q: any, qi: number) => ({
            question: q.question || '',
            questionImageUrl: q.questionImageUrl || '',
            correctOptionId: q.correctOptionId || '',
            marks: Number(q.marks || 1),
            order: Number(q.order || qi + 1),
            options: (q.options || []).map((o: any, oi: number) => ({
              id: o.id || `opt-${si}-${qi}-${oi}`,
              option: o.option || '',
              imageUrl: o.imageUrl || '',
              order: Number(o.order ?? oi),
            })),
          })),
        })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent, forceDraft = false) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isPublished: forceDraft ? false : form.isPublished,
          expiryDate: form.expiryDate || null,
          sections: sections.map((section, si) => ({
            ...section,
            order: si + 1,
            questions: section.questions.map((question, qi) => ({
              ...question,
              order: qi + 1,
              options: question.options.map((option, oi) => ({ ...option, order: oi })),
            })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to update quiz'); return }
      router.push('/admin/quizzes')
    } catch { setError('Something went wrong') }
    finally { setSaving(false) }
  }

  const ic = 'w-full px-4 py-2 bg-dark-900 border border-dark-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50'

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Quiz</h1>
          <p className="mt-1 text-gray-400">Update quiz details</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Quiz Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={ic} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Details</label>
            <RichTextEditor
              value={form.details}
              onChange={(value) => setForm({ ...form, details: value })}
              placeholder="Detailed instructions, rules, and content..."
              minHeightClassName="min-h-[220px]"
            />
            <p className="text-xs text-gray-500 mt-1">Rich text enabled for quiz content/details.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quiz thumbnail</label>
              <p className="text-xs text-gray-500 mb-2">Upload an image, or paste a link below.</p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingThumb}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingThumb(true)
                    uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
                      .then(({ url }) => setForm((p) => ({ ...p, thumbnail: url })))
                      .catch((err: any) => setError(err?.message || 'Thumbnail upload failed'))
                      .finally(() => setUploadingThumb(false))
                    e.currentTarget.value = ''
                  }}
                  className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light disabled:opacity-60"
                />
                {uploadingThumb && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>}
              </div>
              <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste image link instead</summary>
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  className={`${ic} mt-2`}
                  placeholder="https://…"
                />
              </details>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price (₹)</label>
              <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
              <input type="datetime-local" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={ic} />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded border-dark-700" />
                Published
              </label>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-5">
          <h2 className="text-xl font-semibold text-white">Questions & Answers</h2>
          <p className="text-gray-400 text-sm">You can update question images and answer-option images here. Each option may have text, an image, or both.</p>
          {sections.map((section, si) => (
            <div key={si} className="rounded-xl border border-dark-700 bg-dark-900/40 p-4 space-y-4">
              <input
                value={section.title}
                onChange={(e) => {
                  const u = [...sections]
                  u[si].title = e.target.value
                  setSections(u)
                }}
                className={ic}
                placeholder={`Section ${si + 1}`}
              />
              {section.questions.map((q, qi) => (
                <div key={qi} className="rounded-lg border border-dark-700 bg-dark-900 p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-300">Question {qi + 1}</p>
                  <textarea
                    value={q.question}
                    onChange={(e) => {
                      const u = [...sections]
                      u[si].questions[qi].question = e.target.value
                      setSections(u)
                    }}
                    className={ic}
                    rows={2}
                    placeholder="Question text"
                  />
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-400">Question image (optional)</label>
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
                      {uploadingQuestionImg === `${si}-${qi}` && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading...</span>}
                    </div>
                    {q.questionImageUrl && (
                      <img src={q.questionImageUrl} alt="" className="max-h-44 rounded-lg border border-dark-600 bg-dark-900 object-contain" />
                    )}
                    <details className="rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste question image link instead</summary>
                      <input
                        type="url"
                        value={q.questionImageUrl}
                        onChange={(e) => {
                          const u = [...sections]
                          u[si].questions[qi].questionImageUrl = e.target.value
                          setSections(u)
                        }}
                        className={`${ic} mt-2`}
                        placeholder="https://..."
                      />
                    </details>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => {
                        const u = [...sections]
                        u[si].questions[qi].marks = Number(e.target.value || 1)
                        setSections(u)
                      }}
                      className={ic}
                      placeholder="Marks"
                    />
                    <select
                      value={q.correctOptionId}
                      onChange={(e) => {
                        const u = [...sections]
                        u[si].questions[qi].correctOptionId = e.target.value
                        setSections(u)
                      }}
                      className={ic}
                    >
                      <option value="">Select correct option</option>
                      {q.options.map((opt, oi) => (
                        <option key={opt.id} value={opt.id}>Option {oi + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300">Answer options</p>
                    {q.options.map((opt, oi) => {
                      const uploadKey = `${si}-${qi}-${oi}`
                      return (
                        <div key={opt.id} className="rounded-lg border border-dark-700 bg-dark-950/50 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-6 h-6 flex items-center justify-center rounded-full shrink-0 bg-dark-700 text-gray-400">{String.fromCharCode(65 + oi)}</span>
                            <input
                              value={opt.option}
                              onChange={(e) => {
                                const u = [...sections]
                                u[si].questions[qi].options[oi].option = e.target.value
                                setSections(u)
                              }}
                              className={ic}
                              placeholder={`Option ${oi + 1} text (optional if image uploaded)`}
                            />
                          </div>
                          <div className="flex items-center gap-3 pl-8">
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
                            {uploadingOptionImg === uploadKey && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading...</span>}
                          </div>
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt="" className="ml-8 max-h-36 rounded-lg border border-dark-600 bg-dark-900 object-contain" />
                          )}
                          <details className="ml-8 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste option image link instead</summary>
                            <input
                              type="url"
                              value={opt.imageUrl}
                              onChange={(e) => {
                                const u = [...sections]
                                u[si].questions[qi].options[oi].imageUrl = e.target.value
                                setSections(u)
                              }}
                              className={`${ic} mt-2`}
                              placeholder="https://..."
                            />
                          </details>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/admin/quizzes" className="px-6 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700">Cancel</Link>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            className="px-6 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
            <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </form>
    </div>
  )
}
