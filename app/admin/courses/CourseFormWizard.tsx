'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { ArrowLeft, Plus, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
import { uploadFileToApi } from '@/lib/upload-client'

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

interface SubSectionInput {
  title: string
  order: number
  lessons: LessonInput[]
}

interface SectionInput {
  title: string
  order: number
  subsections: SubSectionInput[]
}

const newLesson = (): LessonInput => ({
  title: '',
  description: '',
  duration: '',
  type: 'video',
  videoUrl: '',
  documentUrl: '',
  quizId: '',
  order: 1,
  isPreview: false,
})

const newSubSection = (order: number): SubSectionInput => ({
  title: '',
  order,
  lessons: [newLesson()],
})

const DRAFT_KEY_CREATE = 'admin-create-course-draft-v1'

export type CourseFormWizardMode = 'create' | 'edit'

/** Single toast id so validation errors replace instead of stacking */
const WIZARD_TOAST_ID = 'course-wizard-feedback'

function showWizardError(message: string) {
  toast.error('Fix before continuing', {
    id: WIZARD_TOAST_ID,
    description: message,
    duration: 8000,
  })
}

function showWizardServerError(message: string) {
  toast.error('Could not validate', {
    id: WIZARD_TOAST_ID,
    description: message,
    duration: 8000,
  })
}

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
    subsections: [newSubSection(1)],
  },
]

/** Quill "empty" is often `<p><br></p>` — still truthy but not real content */
function richTextHasContent(html: string): boolean {
  if (!html || typeof html !== 'string') return false
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 0
}

function isValidHttpUrl(s: string | undefined): boolean {
  const t = s?.trim()
  if (!t) return false
  try {
    const u = new URL(t)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Migrate old drafts (section → lessons) to section → subsections → lessons */
function migrateSectionsFromDraft(raw: unknown): SectionInput[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultSections
  return raw.map((s: any, si: number) => {
    const title = typeof s.title === 'string' ? s.title : ''
    const order = typeof s.order === 'number' ? s.order : si + 1
    if (Array.isArray(s.subsections) && s.subsections.length > 0) {
      return {
        title,
        order,
        subsections: s.subsections.map((sub: any, ui: number) => ({
          title:
            typeof sub.title === 'string' && sub.title.trim()
              ? sub.title
              : `Topic ${ui + 1}`,
          order: typeof sub.order === 'number' ? sub.order : ui + 1,
          lessons: Array.isArray(sub.lessons) && sub.lessons.length > 0 ? sub.lessons.map(mapLesson) : [newLesson()],
        })),
      }
    }
    if (Array.isArray(s.lessons) && s.lessons.length > 0) {
      return {
        title,
        order,
        subsections: [{ title: 'Topic 1', order: 1, lessons: s.lessons.map(mapLesson) }],
      }
    }
    return { title, order, subsections: [newSubSection(1)] }
  })
}

function mapLesson(l: any): LessonInput {
  return {
    title: typeof l.title === 'string' ? l.title : '',
    description: typeof l.description === 'string' ? l.description : '',
    duration: typeof l.duration === 'string' ? l.duration : '',
    type:
      l.type === 'document' || l.type === 'quiz'
        ? l.type
        : l.type === 'reading'
          ? 'document'
          : 'video',
    videoUrl: typeof l.videoUrl === 'string' ? l.videoUrl : '',
    documentUrl: typeof l.documentUrl === 'string' ? l.documentUrl : '',
    quizId: typeof l.quizId === 'string' ? l.quizId : '',
    order: typeof l.order === 'number' ? l.order : 1,
    isPreview: !!l.isPreview,
  }
}

/** Map Prisma lesson row (content holds URL or quiz id) to wizard fields. */
function dbLessonToInput(l: {
  title: string
  description?: string | null
  content?: string | null
  duration?: string | null
  type: string
  order: number
  isPreview?: boolean
}): LessonInput {
  const raw = l.type
  const type: LessonInput['type'] =
    raw === 'document' || raw === 'quiz' ? raw : raw === 'reading' ? 'document' : 'video'
  const content = typeof l.content === 'string' ? l.content : ''
  return {
    title: l.title || '',
    description: typeof l.description === 'string' ? l.description : '',
    duration: typeof l.duration === 'string' ? l.duration : '',
    type,
    videoUrl: type === 'video' ? content : '',
    documentUrl: type === 'document' ? content : '',
    quizId: type === 'quiz' ? content : '',
    order: typeof l.order === 'number' ? l.order : 1,
    isPreview: !!l.isPreview,
  }
}

function courseFromApiToState(course: {
  title: string
  description: string
  descriptionFull: string
  thumbnail: string
  price: number
  originalPrice?: number | null
  language?: string | null
  timeline?: string | null
  categoryId: string
  metaTitle?: string | null
  metaDescription?: string | null
  keywords?: string | null
  whatYouWillLearn?: { content: string }[]
  requirements?: { content: string }[]
  sections?: Array<{
    title: string
    order: number
    subsections?: Array<{
      title: string
      order: number
      lessons?: Array<{
        title: string
        description?: string | null
        content?: string | null
        duration?: string | null
        type: string
        order: number
        isPreview?: boolean
      }>
    }>
  }>
}) {
  const form = {
    title: course.title || '',
    description: course.description || '',
    descriptionFull: course.descriptionFull || '',
    thumbnail: course.thumbnail || '',
    price: course.price ?? 0,
    originalPrice: course.originalPrice ?? 0,
    language: course.language || 'English',
    timeline: course.timeline || '',
    categoryId: course.categoryId || '',
    whatYouWillLearn:
      course.whatYouWillLearn && course.whatYouWillLearn.length > 0
        ? course.whatYouWillLearn.map((w) => w.content)
        : [''],
    requirements:
      course.requirements && course.requirements.length > 0
        ? course.requirements.map((r) => r.content)
        : [''],
    metaTitle: course.metaTitle || '',
    metaDescription: course.metaDescription || '',
    keywords: course.keywords || '',
  }

  const list = course.sections || []
  if (list.length === 0) {
    return { form, sections: defaultSections }
  }

  const sections: SectionInput[] = list.map((s, si) => ({
    title: typeof s.title === 'string' ? s.title : '',
    order: typeof s.order === 'number' ? s.order : si + 1,
    subsections:
      Array.isArray(s.subsections) && s.subsections.length > 0
        ? s.subsections.map((sub, ui) => ({
            title:
              typeof sub.title === 'string' && sub.title.trim()
                ? sub.title
                : `Topic ${ui + 1}`,
            order: typeof sub.order === 'number' ? sub.order : ui + 1,
            lessons:
              Array.isArray(sub.lessons) && sub.lessons.length > 0
                ? sub.lessons.map((lesson) => dbLessonToInput(lesson))
                : [newLesson()],
          }))
        : [newSubSection(1)],
  }))

  return { form, sections }
}

/** Subsection titles are optional in the UI — API always gets a non-empty title */
function buildSectionsApiPayload(sections: SectionInput[]) {
  return sections.map((s) => ({
    title: s.title.trim(),
    subsections: s.subsections.map((sub, ui) => ({
      title: sub.title.trim() || `Topic ${ui + 1}`,
      lessons: sub.lessons.map((l) => ({
        title: l.title.trim(),
        type: l.type,
        videoUrl: l.videoUrl?.trim() ? l.videoUrl.trim() : null,
        documentUrl: l.documentUrl?.trim() ? l.documentUrl.trim() : null,
        quizId: l.quizId?.trim() ? l.quizId.trim() : null,
      })),
    })),
  }))
}

export default function CourseFormWizard({
  mode,
  courseId,
}: {
  mode: CourseFormWizardMode
  courseId?: string
}) {
  const router = useRouter()
  const enableDraft = mode === 'create'
  const [categories, setCategories] = useState<Category[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [sections, setSections] = useState<SectionInput[]>(defaultSections)
  const [currentStep, setCurrentStep] = useState(1)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [validatingStep, setValidatingStep] = useState(false)
  const [courseLoading, setCourseLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingLessonMedia, setUploadingLessonMedia] = useState<string | null>(null)

  const steps = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Learning Points' },
    { id: 3, title: 'Requirements' },
    { id: 4, title: 'Course Content' },
    {
      id: 5,
      title: mode === 'edit' ? 'Review & Save' : 'Review & Create',
    },
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
    if (mode !== 'edit' || !courseId) return
    let cancelled = false
    setCourseLoading(true)
    setLoadError('')
    fetch(`/api/admin/courses/${courseId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Failed to load course')
        return data
      })
      .then((course) => {
        if (cancelled) return
        const { form: nextForm, sections: nextSections } = courseFromApiToState(course)
        setForm(nextForm)
        setSections(nextSections)
        setCurrentStep(1)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || 'Failed to load course')
      })
      .finally(() => {
        if (!cancelled) setCourseLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, courseId])

  useEffect(() => {
    if (!enableDraft) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY_CREATE)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.form) setForm(parsed.form)
      if (parsed?.sections?.length) setSections(migrateSectionsFromDraft(parsed.sections))
      if (parsed?.currentStep) setCurrentStep(parsed.currentStep)
      setDraftLoaded(true)
    } catch {
      // ignore broken draft payload
    }
  }, [enableDraft])

  useEffect(() => {
    if (!enableDraft) return
    const payload = { form, sections, currentStep }
    localStorage.setItem(DRAFT_KEY_CREATE, JSON.stringify(payload))
  }, [enableDraft, form, sections, currentStep])

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
        subsections: [newSubSection(1)],
      },
    ])

  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i))

  const addSubSection = (sectionIdx: number) => {
    const updated = [...sections]
    const nextOrder = updated[sectionIdx].subsections.length + 1
    updated[sectionIdx].subsections.push(newSubSection(nextOrder))
    setSections(updated)
  }

  const removeSubSection = (sectionIdx: number, subIdx: number) => {
    const updated = [...sections]
    if (updated[sectionIdx].subsections.length <= 1) return
    updated[sectionIdx].subsections = updated[sectionIdx].subsections.filter((_, i) => i !== subIdx)
    setSections(updated)
  }

  const addLesson = (sectionIdx: number, subIdx: number) => {
    const updated = [...sections]
    const sub = updated[sectionIdx].subsections[subIdx]
    sub.lessons.push({
      ...newLesson(),
      order: sub.lessons.length + 1,
    })
    setSections(updated)
  }

  const removeLesson = (sectionIdx: number, subIdx: number, lessonIdx: number) => {
    const updated = [...sections]
    const sub = updated[sectionIdx].subsections[subIdx]
    if (sub.lessons.length <= 1) return
    sub.lessons = sub.lessons.filter((_, idx) => idx !== lessonIdx)
    setSections(updated)
  }

  /** Returns `null` if valid, otherwise a specific message (fixes vague "fill all fields" UX). */
  const getStepValidationError = (step: number): string | null => {
    if (step === 1) {
      if (!form.title?.trim()) return 'Enter a course title.'
      if (!form.description?.trim()) return 'Enter a short description.'
      if (!richTextHasContent(form.descriptionFull)) {
        return 'Full description must include some real text (an empty editor is not enough).'
      }
      if (!isValidHttpUrl(form.thumbnail)) return 'Upload a course thumbnail or add a valid image link under “Paste link instead”.'
      if (!form.categoryId?.trim()) return 'Select a category.'
      return null
    }
    if (step === 2) {
      if (!form.whatYouWillLearn.some((p) => p.trim())) return 'Add at least one learning point with text.'
      return null
    }
    if (step === 3) {
      if (!form.requirements.some((r) => r.trim())) return 'Add at least one requirement with text.'
      return null
    }
    if (step === 4) {
      for (let si = 0; si < sections.length; si++) {
        const section = sections[si]
        if (!section.title?.trim()) {
          return `Section ${si + 1}: enter a section title (e.g. module name).`
        }
        if (!section.subsections?.length) {
          return `Section "${section.title.trim()}": add at least one subsection.`
        }
        for (let ui = 0; ui < section.subsections.length; ui++) {
          const sub = section.subsections[ui]
          if (!sub.lessons?.length) {
            const subLabel = sub.title?.trim() || `Topic ${ui + 1}`
            return `Subsection "${subLabel}": add at least one lesson.`
          }
          for (let li = 0; li < sub.lessons.length; li++) {
            const lesson = sub.lessons[li]
            if (!lesson.title?.trim()) {
              const subLabel = sub.title?.trim() || `Topic ${ui + 1}`
              return `In "${subLabel}": enter a title for lesson ${li + 1}.`
            }
            if (lesson.type === 'video' && !isValidHttpUrl(lesson.videoUrl)) {
              return `Lesson "${lesson.title.trim()}": upload a video file or paste a valid video link.`
            }
            if (lesson.type === 'document' && !isValidHttpUrl(lesson.documentUrl)) {
              return `Lesson "${lesson.title.trim()}": upload a document or paste a valid file link.`
            }
            if (lesson.type === 'quiz' && !lesson.quizId?.trim()) {
              return `Lesson "${lesson.title.trim()}": select a quiz from the list.`
            }
          }
        }
      }
      return null
    }
    return null
  }

  const validateCurrentStepServer = async (step: number) => {
    const payload: any = {}
    if (step === 1) {
      payload.title = form.title.trim()
      payload.description = form.description.trim()
      payload.descriptionFull = form.descriptionFull.replace(/<[^>]*>/g, '').trim()
      payload.thumbnail = form.thumbnail.trim()
      payload.categoryId = form.categoryId.trim()
    } else if (step === 2) {
      payload.whatYouWillLearn = form.whatYouWillLearn.filter((p) => p.trim())
    } else if (step === 3) {
      payload.requirements = form.requirements.filter((r) => r.trim())
    } else if (step === 4) {
      payload.sections = buildSectionsApiPayload(sections)
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
    const validationMsg = getStepValidationError(currentStep)
    if (validationMsg) {
      showWizardError(validationMsg)
      return
    }
    setValidatingStep(true)
    try {
      await validateCurrentStepServer(currentStep)
      toast.dismiss(WIZARD_TOAST_ID)
      setCurrentStep((s) => Math.min(s + 1, steps.length))
    } catch (err: any) {
      showWizardServerError(err?.message || 'Unable to validate this step')
    } finally {
      setValidatingStep(false)
    }
  }

  const prevStep = () => {
    toast.dismiss(WIZARD_TOAST_ID)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY_CREATE)
    setForm(defaultForm)
    setSections(defaultSections)
    setCurrentStep(1)
    setDraftLoaded(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    for (let st = 1; st <= 4; st++) {
      const msg = getStepValidationError(st)
      if (msg) {
        setCurrentStep(st)
        showWizardError(msg)
        return
      }
    }
    setLoading(true)

    const payload = {
      ...form,
      whatYouWillLearn: form.whatYouWillLearn.filter(Boolean),
      requirements: form.requirements.filter(Boolean),
      sections: sections.map((s, i) => ({
        title: s.title.trim(),
        order: i + 1,
        subsections: s.subsections.map((sub, j) => ({
          title: sub.title.trim() || `Topic ${j + 1}`,
          order: j + 1,
          lessons: sub.lessons.map((l, k) => ({
            title: l.title.trim(),
            description: l.description || undefined,
            duration: l.duration || '0:00',
            type: l.type,
            order: k + 1,
            isPreview: l.isPreview,
            videoUrl: l.videoUrl?.trim() || undefined,
            documentUrl: l.documentUrl?.trim() || undefined,
            quizId: l.quizId?.trim() || undefined,
          })),
        })),
      })),
    }

    try {
      const res =
        mode === 'edit' && courseId
          ? await fetch(`/api/admin/courses/${courseId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch('/api/courses/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

      const data = await res.json()
      if (!res.ok) {
        toast.error(mode === 'edit' ? 'Course not saved' : 'Course not created', {
          id: WIZARD_TOAST_ID,
          description: data.error || (mode === 'edit' ? 'Failed to update course' : 'Failed to create course'),
          duration: 8000,
        })
        return
      }
      if (enableDraft) localStorage.removeItem(DRAFT_KEY_CREATE)
      toast.success(mode === 'edit' ? 'Course updated' : 'Course created', {
        description: 'Redirecting to your courses…',
        duration: 3001,
      })
      router.push('/admin/courses')
    } catch {
      toast.error('Something went wrong', {
        id: WIZARD_TOAST_ID,
        description: 'Please try again in a moment.',
        duration: 8000,
      })
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

  const uploadThumbnail = async (file: File) => {
    setUploadingThumbnail(true)
    try {
      const { url } = await uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
      setForm((prev) => ({ ...prev, thumbnail: url }))
      toast.success('Thumbnail uploaded')
    } catch (e: any) {
      toast.error('Thumbnail upload failed', { description: e?.message || 'Please try again' })
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const uploadLessonFile = async (params: {
    sectionIdx: number
    subIdx: number
    lessonIdx: number
    type: 'video' | 'document'
    file: File
  }) => {
    const key = `${params.sectionIdx}-${params.subIdx}-${params.lessonIdx}-${params.type}`
    setUploadingLessonMedia(key)
    try {
      const endpoint = params.type === 'video' ? '/api/upload/video' : '/api/upload/document'
      const { url } = await uploadFileToApi({ endpoint, file: params.file })
      setSections((prev) => {
        const updated = [...prev]
        const lesson = updated[params.sectionIdx].subsections[params.subIdx].lessons[params.lessonIdx]
        if (params.type === 'video') lesson.videoUrl = url
        else lesson.documentUrl = url
        return updated
      })
      toast.success(params.type === 'video' ? 'Video uploaded' : 'Document uploaded')
    } catch (e: any) {
      toast.error('Upload failed', { description: e?.message || 'Please try again' })
    } finally {
      setUploadingLessonMedia(null)
    }
  }

  if (mode === 'edit' && courseLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-gray-400 text-sm">Loading course…</p>
      </div>
    )
  }

  if (mode === 'edit' && loadError) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Link href="/admin/courses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          Back to courses
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">{loadError}</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{mode === 'edit' ? 'Edit Course' : 'Create Course'}</h1>
          <p className="mt-1 text-gray-400">
            {mode === 'edit' ? 'Update course details and curriculum' : 'Step-by-step wizard with auto-save draft'}
          </p>
        </div>
      </div>

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
        {enableDraft && draftLoaded && (
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Course thumbnail *</label>
                <p className="text-xs text-gray-500 mb-2">Upload an image (JPG, PNG, WebP, GIF — max 5MB), or use a link below.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingThumbnail}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadThumbnail(file)
                      e.currentTarget.value = ''
                    }}
                    className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light disabled:opacity-60"
                  />
                  {uploadingThumbnail && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>}
                </div>
                {isValidHttpUrl(form.thumbnail) && (
                  <img
                    src={form.thumbnail}
                    alt=""
                    className="mt-3 max-h-36 rounded-lg border border-dark-600 object-contain bg-dark-900"
                  />
                )}
                <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste image link instead</summary>
                  <input
                    type="url"
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    className={`${inputClass} mt-2`}
                    placeholder="https://…"
                  />
                </details>
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
            <div>
              <h2 className="text-xl font-semibold text-white">Course Content</h2>
              <p className="text-sm text-gray-400 mt-1">
                Structure: <span className="text-primary-300">Section</span> → <span className="text-primary-300">Subsection</span> →{' '}
                <span className="text-gray-300">Lessons</span>. Use subsections to group topics inside each module.
              </p>
            </div>
            {sections.map((section, si) => (
              <div
                key={si}
                className="rounded-xl border-2 border-primary/25 bg-dark-900/40 p-4 space-y-4 shadow-inner"
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-dark-600 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-400 shrink-0">Section {si + 1}</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const updated = [...sections]
                      updated[si].title = e.target.value
                      setSections(updated)
                    }}
                    className={`${inputClass} flex-1 min-w-[200px]`}
                    placeholder={`e.g. Module ${si + 1}: Introduction`}
                  />
                  {sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(si)} className="text-red-400 hover:text-red-300 p-2 shrink-0" title="Remove section">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {section.subsections.map((sub, ui) => (
                  <div
                    key={ui}
                    className="ml-0 sm:ml-3 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-primary/35 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 bg-dark-800/80 rounded-lg px-3 py-2 border border-dark-600">
                      <span className="text-xs font-semibold text-amber-200/90 shrink-0">Subsection {ui + 1}</span>
                      <input
                        type="text"
                        value={sub.title}
                        onChange={(e) => {
                          const updated = [...sections]
                          updated[si].subsections[ui].title = e.target.value
                          setSections(updated)
                        }}
                        className={`${inputClass} flex-1 min-w-[180px] text-sm`}
                        placeholder={`e.g. Topic ${ui + 1} or Unit name`}
                      />
                      {section.subsections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubSection(si, ui)}
                          className="text-red-400/90 hover:text-red-300 p-1.5 shrink-0 text-xs"
                          title="Remove subsection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 pl-0 sm:pl-2">
                      {sub.lessons.map((lesson, li) => (
                        <div
                          key={li}
                          className="rounded-lg border border-dark-600 bg-dark-900 p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wide text-gray-500">Lesson {li + 1}</span>
                            {sub.lessons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLesson(si, ui, li)}
                                className="text-red-400 hover:text-red-300 ml-auto"
                                title="Remove lesson"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const updated = [...sections]
                              updated[si].subsections[ui].lessons[li].title = e.target.value
                              setSections(updated)
                            }}
                            className={inputClass}
                            placeholder="Lesson title"
                          />

                          <select
                            value={lesson.type}
                            onChange={(e) => {
                              const updated = [...sections]
                              const nextType = e.target.value as LessonInput['type']
                              updated[si].subsections[ui].lessons[li].type = nextType
                              updated[si].subsections[ui].lessons[li].videoUrl = ''
                              updated[si].subsections[ui].lessons[li].documentUrl = ''
                              updated[si].subsections[ui].lessons[li].quizId = ''
                              setSections(updated)
                            }}
                            className={inputClass}
                          >
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="quiz">Quiz</option>
                          </select>

                          {lesson.type === 'video' && (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-400">Video *</label>
                              <p className="text-[11px] text-gray-500">Upload a video file, or paste a URL (e.g. YouTube) below.</p>
                              <div className="flex items-center gap-3">
                                <input
                                  type="file"
                                  accept="video/*"
                                  disabled={uploadingLessonMedia !== null}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      void uploadLessonFile({
                                        sectionIdx: si,
                                        subIdx: ui,
                                        lessonIdx: li,
                                        type: 'video',
                                        file,
                                      })
                                    }
                                    e.currentTarget.value = ''
                                  }}
                                  className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary/90 file:text-white hover:file:bg-primary disabled:opacity-60"
                                />
                                {uploadingLessonMedia === `${si}-${ui}-${li}-video` && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>
                                )}
                              </div>
                              <details className="rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste video link instead</summary>
                                <input
                                  type="url"
                                  value={lesson.videoUrl || ''}
                                  onChange={(e) => {
                                    const updated = [...sections]
                                    updated[si].subsections[ui].lessons[li].videoUrl = e.target.value
                                    setSections(updated)
                                  }}
                                  className={`${inputClass} mt-2`}
                                  placeholder="https://…"
                                />
                              </details>
                            </div>
                          )}

                          {lesson.type === 'document' && (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-400">Document *</label>
                              <p className="text-[11px] text-gray-500">Upload a PDF or other supported file, or paste a link below.</p>
                              <div className="flex items-center gap-3">
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.rtf,application/pdf"
                                  disabled={uploadingLessonMedia !== null}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      void uploadLessonFile({
                                        sectionIdx: si,
                                        subIdx: ui,
                                        lessonIdx: li,
                                        type: 'document',
                                        file,
                                      })
                                    }
                                    e.currentTarget.value = ''
                                  }}
                                  className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary/90 file:text-white hover:file:bg-primary disabled:opacity-60"
                                />
                                {uploadingLessonMedia === `${si}-${ui}-${li}-document` && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>
                                )}
                              </div>
                              <details className="rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste document link instead</summary>
                                <input
                                  type="url"
                                  value={lesson.documentUrl || ''}
                                  onChange={(e) => {
                                    const updated = [...sections]
                                    updated[si].subsections[ui].lessons[li].documentUrl = e.target.value
                                    setSections(updated)
                                  }}
                                  className={`${inputClass} mt-2`}
                                  placeholder="https://…"
                                />
                              </details>
                            </div>
                          )}

                          {lesson.type === 'quiz' && (
                            <div className="space-y-2">
                              <select
                                required
                                value={lesson.quizId || ''}
                                onChange={(e) => {
                                  const updated = [...sections]
                                  updated[si].subsections[ui].lessons[li].quizId = e.target.value
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
                                <div className="text-xs text-gray-400 bg-dark-800 border border-dark-700 rounded p-2">
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
                                updated[si].subsections[ui].lessons[li].isPreview = e.target.checked
                                setSections(updated)
                              }}
                              className="rounded border-dark-700"
                            />
                            Preview lesson
                          </label>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addLesson(si, ui)}
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-4 h-4" /> Add lesson in this subsection
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSubSection(si)}
                  className="text-sm flex items-center gap-1 px-3 py-2 rounded-lg border border-primary/30 text-primary-300 hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4" /> Add subsection to this section
                </button>
              </div>
            ))}
            <button type="button" onClick={addSection} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 font-medium">
              <Plus className="w-4 h-4" /> Add section
            </button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4 text-gray-200">
            <h2 className="text-xl font-semibold text-white">{mode === 'edit' ? 'Review & Save' : 'Review & Create'}</h2>
            <p><span className="text-gray-400">Title:</span> {form.title || '-'}</p>
            <p><span className="text-gray-400">Category:</span> {categories.find((c) => c.id === form.categoryId)?.name || '-'}</p>
            <p><span className="text-gray-400">Price:</span> INR {form.price}</p>
            <p><span className="text-gray-400">Sections:</span> {sections.length}</p>
            <p>
              <span className="text-gray-400">Subsections:</span>{' '}
              {sections.reduce((sum, s) => sum + s.subsections.length, 0)}
            </p>
            <p>
              <span className="text-gray-400">Lessons:</span>{' '}
              {sections.reduce(
                (sum, s) => sum + s.subsections.reduce((ss, sub) => ss + sub.lessons.length, 0),
                0
              )}
            </p>
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
                {loading ? (mode === 'edit' ? 'Saving...' : 'Creating...') : mode === 'edit' ? 'Save changes' : 'Create Course'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
