'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

interface Category {
  id: string
  name: string
}

interface QuizOption {
  id: string
  option: string
}

interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
}

interface QuizSection {
  id: string
  title: string
  questions: QuizQuestion[]
}

interface Quiz {
  id: string
  title: string
  sections: QuizSection[]
  isPublished: boolean
}

interface LessonInput {
  title: string
  description: string
  duration: string
  type: 'video' | 'document' | 'quiz'
  videoUrl?: string
  documentUrl?: string
  quizId?: string
  order: number
  isPreview: boolean
}

interface SectionInput {
  title: string
  order: number
  lessons: LessonInput[]
}

const DRAFT_KEY = 'admin-create-course-draft-v1'

const defaultForm = {
  title: '',
  description: '',
  descriptionFull: '',
  thumbnail: '',
  price: 0,
  originalPrice: 0,
  language: 'English',
  timeline: '',
  categoryId: '',
  whatYouWillLearn: [''],
  requirements: [''],
  metaTitle: '',
  metaDescription: '',
  keywords: '',
}

const defaultSections: SectionInput[] = [
  {
    title: '',
    order: 1,
    lessons: [
      {
        title: '',
        description: '',
        duration: '',
        type: 'video',
        videoUrl: '',
        documentUrl: '',
        quizId: '',
        order: 1,
        isPreview: false,
      },
    ],
  },
]

export default function CreateCoursePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [sections, setSections] = useState<SectionInput[]>(defaultSections)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [validatingStep, setValidatingStep] = useState(false)

  const steps = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Learning Points' },
    { id: 3, title: 'Requirements' },
    { id: 4, title: 'Course Content' },
    { id: 5, title: 'Review & Create' },
  ]

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error)

    fetch('/api/admin/quizzes')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setQuizzes(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.form) setForm(parsed.form)
      if (parsed?.sections?.length) setSections(parsed.sections)
      if (parsed?.currentStep) setCurrentStep(parsed.currentStep)
      setDraftLoaded(true)
    } catch {
      // ignore broken draft payload
    }
  }, [])

  useEffect(() => {
    const payload = { form, sections, currentStep }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  }, [form, sections, currentStep])

  const addLearningPoint = () => setForm({ ...form, whatYouWillLearn: [...form.whatYouWillLearn, ''] })
  const removeLearningPoint = (i: number) => setForm({ ...form, whatYouWillLearn: form.whatYouWillLearn.filter((_, idx) => idx !== i) })
  const addRequirement = () => setForm({ ...form, requirements: [...form.requirements, ''] })
  const removeRequirement = (i: number) => setForm({ ...form, requirements: form.requirements.filter((_, idx) => idx !== i) })

  const addSection = () =>
    setSections([
      ...sections,
      {
        title: '',
        order: sections.length + 1,
        lessons: [
          {
            title: '',
            description: '',
            duration: '',
            type: 'video',
            videoUrl: '',
            documentUrl: '',
            quizId: '',
            order: 1,
            isPreview: false,
          },
        ],
      },
    ])

  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i))

  const addLesson = (sectionIdx: number) => {
    const updated = [...sections]
    updated[sectionIdx].lessons.push({
      title: '',
      description: '',
      duration: '',
      type: 'video',
      videoUrl: '',
      documentUrl: '',
      quizId: '',
      order: updated[sectionIdx].lessons.length + 1,
      isPreview: false,
    })
    setSections(updated)
  }

  const removeLesson = (sectionIdx: number, lessonIdx: number) => {
    const updated = [...sections]
    updated[sectionIdx].lessons = updated[sectionIdx].lessons.filter((_, idx) => idx !== lessonIdx)
    setSections(updated)
  }

  const validateStep = (step: number) => {
    if (step === 1) {
      return !!(form.title && form.description && form.descriptionFull && form.thumbnail && form.categoryId)
    }
    if (step === 2) return form.whatYouWillLearn.some((p) => p.trim())
    if (step === 3) return form.requirements.some((r) => r.trim())
    if (step === 4) {
      return sections.every((section) =>
        section.title.trim() &&
        section.lessons.length > 0 &&
        section.lessons.every((lesson) => {
          if (!lesson.title.trim()) return false
          if (lesson.type === 'video') return !!lesson.videoUrl
          if (lesson.type === 'document') return !!lesson.documentUrl
          if (lesson.type === 'quiz') return !!lesson.quizId
          return true
        })
      )
    }
    return true
  }

  const validateCurrentStepServer = async (step: number) => {
    const payload: any = {}
    if (step === 1) {
      payload.title = form.title
      payload.description = form.description
      payload.descriptionFull = form.descriptionFull.replace(/<[^>]*>/g, '').trim()
      payload.thumbnail = form.thumbnail
      payload.categoryId = form.categoryId
    } else if (step === 2) {
      payload.whatYouWillLearn = form.whatYouWillLearn.filter((p) => p.trim())
    } else if (step === 3) {
      payload.requirements = form.requirements.filter((r) => r.trim())
    } else if (step === 4) {
      payload.sections = sections.map((s) => ({
        title: s.title,
        lessons: s.lessons.map((l) => ({
          title: l.title,
          type: l.type,
          videoUrl: l.videoUrl || null,
          documentUrl: l.documentUrl || null,
          quizId: l.quizId || null,
        })),
      }))
    }

    const res = await fetch('/api/courses/create/step-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, payload }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data?.error || 'Step validation failed')
    }
  }

  const nextStep = async () => {
    setError('')
    if (!validateStep(currentStep)) {
      setError('Please complete required fields in this step before continuing.')
      return
    }
    setValidatingStep(true)
    try {
      await validateCurrentStepServer(currentStep)
      setCurrentStep((s) => Math.min(s + 1, steps.length))
    } catch (err: any) {
      setError(err?.message || 'Unable to validate this step')
    } finally {
      setValidatingStep(false)
    }
  }

  const prevStep = () => {
    setError('')
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setForm(defaultForm)
    setSections(defaultSections)
    setCurrentStep(1)
    setDraftLoaded(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/courses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          whatYouWillLearn: form.whatYouWillLearn.filter(Boolean),
          requirements: form.requirements.filter(Boolean),
          sections: sections.map((s, i) => ({
            ...s,
            order: i + 1,
            lessons: s.lessons.map((l, j) => ({
              ...l,
              order: j + 1,
              videoUrl: l.videoUrl || undefined,
              documentUrl: l.documentUrl || undefined,
              quizId: l.quizId || undefined,
            })),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create course')
        return
      }
      localStorage.removeItem(DRAFT_KEY)
      router.push('/admin/courses')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2 bg-dark-900 border border-dark-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50'

  const selectedQuizMeta = (quizId?: string) => {
    const quiz = quizzes.find((q) => q.id === quizId)
    if (!quiz) return null
    const questionCount = quiz.sections.reduce((sum, sec) => sum + (sec.questions?.length || 0), 0)
    return `${quiz.sections.length} sections, ${questionCount} questions`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Course</h1>
          <p className="mt-1 text-gray-400">Step-by-step wizard with auto-save draft</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Course Creation Wizard</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {currentStep === 1 && (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Short Description *</label>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Description *</label>
              <RichTextEditor
                value={form.descriptionFull}
                onChange={(value) => setForm({ ...form, descriptionFull: value })}
                placeholder="Write detailed course description..."
                minHeightClassName="min-h-[220px]"
              />
              <p className="text-xs text-gray-500 mt-1">Rich text supported. Use the toolbar to format content.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL *</label>
                <input type="url" required value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Price (INR) *</label>
                <input type="number" required min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Original Price (INR)</label>
                <input type="number" min={0} step={0.01} value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Timeline</label>
                <input type="text" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className={inputClass} placeholder="e.g., 6 Months" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">What You Will Learn</h2>
            {form.whatYouWillLearn.map((point, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => {
                    const updated = [...form.whatYouWillLearn]
                    updated[i] = e.target.value
                    setForm({ ...form, whatYouWillLearn: updated })
                  }}
                  className={inputClass}
                  placeholder="Learning point"
                />
                {form.whatYouWillLearn.length > 1 && (
                  <button type="button" onClick={() => removeLearningPoint(i)} className="text-red-400 hover:text-red-300 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addLearningPoint} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add point
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Requirements</h2>
            {form.requirements.map((req, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => {
                    const updated = [...form.requirements]
                    updated[i] = e.target.value
                    setForm({ ...form, requirements: updated })
                  }}
                  className={inputClass}
                  placeholder="Requirement"
                />
                {form.requirements.length > 1 && (
                  <button type="button" onClick={() => removeRequirement(i)} className="text-red-400 hover:text-red-300 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addRequirement} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add requirement
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white">Course Content</h2>
            {sections.map((section, si) => (
              <div key={si} className="border border-dark-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[si].title = e.target.value
                      setSections(updated)
                    }}
                    className={inputClass}
                    placeholder={`Section ${si + 1} title`}
                  />
                  {sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(si)} className="text-red-400 hover:text-red-300 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {section.lessons.map((lesson, li) => (
                  <div key={li} className="ml-4 border-l-2 border-dark-700 pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Lesson {li + 1}</span>
                      {section.lessons.length > 1 && (
                        <button type="button" onClick={() => removeLesson(si, li)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[si].lessons[li].title = e.target.value
                        setSections(updated)
                      }}
                      className={inputClass}
                      placeholder="Lesson title"
                    />

                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={lesson.type}
                        onChange={(e) => {
                          const updated = [...sections]
                          const nextType = e.target.value as LessonInput['type']
                          updated[si].lessons[li].type = nextType
                          updated[si].lessons[li].videoUrl = ''
                          updated[si].lessons[li].documentUrl = ''
                          updated[si].lessons[li].quizId = ''
                          setSections(updated)
                        }}
                        className={inputClass}
                      >
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="quiz">Quiz</option>
                      </select>
                    </div>

                    {lesson.type === 'video' && (
                      <input
                        type="url"
                        required
                        value={lesson.videoUrl || ''}
                        onChange={(e) => {
                          const updated = [...sections]
                          updated[si].lessons[li].videoUrl = e.target.value
                          setSections(updated)
                        }}
                        className={inputClass}
                        placeholder="Video URL (required)"
                      />
                    )}

                    {lesson.type === 'document' && (
                      <input
                        type="url"
                        required
                        value={lesson.documentUrl || ''}
                        onChange={(e) => {
                          const updated = [...sections]
                          updated[si].lessons[li].documentUrl = e.target.value
                          setSections(updated)
                        }}
                        className={inputClass}
                        placeholder="Document URL (required)"
                      />
                    )}

                    {lesson.type === 'quiz' && (
                      <div className="space-y-2">
                        <select
                          required
                          value={lesson.quizId || ''}
                          onChange={(e) => {
                            const updated = [...sections]
                            updated[si].lessons[li].quizId = e.target.value
                            setSections(updated)
                          }}
                          className={inputClass}
                        >
                          <option value="">Select quiz</option>
                          {quizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </option>
                          ))}
                        </select>
                        {lesson.quizId && (
                          <div className="text-xs text-gray-400 bg-dark-900 border border-dark-700 rounded p-2">
                            {selectedQuizMeta(lesson.quizId)}
                          </div>
                        )}
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={lesson.isPreview}
                        onChange={(e) => {
                          const updated = [...sections]
                          updated[si].lessons[li].isPreview = e.target.checked
                          setSections(updated)
                        }}
                        className="rounded border-dark-700"
                      />
                      Preview lesson
                    </label>
                  </div>
                ))}

                <button type="button" onClick={() => addLesson(si)} className="ml-4 text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Lesson
                </button>
              </div>
            ))}
            <button type="button" onClick={addSection} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Section
            </button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4 text-gray-200">
            <h2 className="text-xl font-semibold text-white">Review & Create</h2>
            <p><span className="text-gray-400">Title:</span> {form.title || '-'}</p>
            <p><span className="text-gray-400">Category:</span> {categories.find((c) => c.id === form.categoryId)?.name || '-'}</p>
            <p><span className="text-gray-400">Price:</span> INR {form.price}</p>
            <p><span className="text-gray-400">Sections:</span> {sections.length}</p>
            <p><span className="text-gray-400">Lessons:</span> {sections.reduce((sum, s) => sum + s.lessons.length, 0)}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <Link href="/admin/courses" className="px-6 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700 transition-colors">
              Cancel
            </Link>
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {currentStep < steps.length ? (
              <button type="button" disabled={validatingStep} onClick={nextStep} className="px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center gap-1 disabled:opacity-60">
                {validatingStep ? 'Validating...' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2">
                <Save className="w-5 h-5" />
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
