'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  ExternalLink,
} from 'lucide-react'
import { getYouTubeEmbedUrl } from '@/lib/youtube-embed'

type CurriculumLesson = {
  id: string
  title: string
  type: string
  completed: boolean
  progress: number
}

type CurriculumSubsection = {
  id: string
  title: string
  lessons: CurriculumLesson[]
}

type CurriculumSection = {
  id: string
  title: string
  subsections: CurriculumSubsection[]
}

type LearnCurriculum = { sections: CurriculumSection[] }

function lessonTypeIcon(type: string) {
  if (type === 'video') return '▶'
  if (type === 'document') return '📄'
  return '❓'
}

type LessonPayload = {
  course: { id: string; title: string }
  lesson: {
    id: string
    title: string
    description: string | null
    content: string | null
    duration: string
    type: string
    isPreview: boolean
    sectionTitle: string
    subsectionTitle: string
  }
  navigation: {
    lessonIndex: number
    totalLessons: number
    prevLessonId: string | null
    nextLessonId: string | null
  }
  enrolled: boolean
  progress: { completed: boolean; progress: number } | null
}

export default function CourseLessonPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = typeof params.id === 'string' ? params.id : params.id?.[0]
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : params.lessonId?.[0]

  const [data, setData] = useState<LessonPayload | null>(null)
  const [sidebarTree, setSidebarTree] = useState<LearnCurriculum | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const curriculumCourseKeyRef = useRef<string | null>(null)
  const accordionLessonRef = useRef<string | null>(null)

  const loadLesson = useCallback(async () => {
    if (!courseId || !lessonId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?callback=${encodeURIComponent(`/courses/${courseId}/learn/${lessonId}`)}`)
          return
        }
        setError(json?.error || 'Could not load lesson')
        setData(null)
        return
      }
      setData(json as LessonPayload)

      if (json.enrolled) {
        if (curriculumCourseKeyRef.current !== courseId) {
          const st = await fetch(`/api/courses/${courseId}/learn/state`)
          if (st.ok) {
            const s = await st.json()
            setSidebarTree(s.curriculum && s.curriculum.sections?.length ? s.curriculum : null)
            curriculumCourseKeyRef.current = courseId
          }
        }
      } else {
        setSidebarTree(null)
        curriculumCourseKeyRef.current = null
      }
    } catch {
      setError('Something went wrong')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [courseId, lessonId, router])

  useEffect(() => {
    loadLesson()
  }, [loadLesson])

  useEffect(() => {
    accordionLessonRef.current = null
  }, [courseId])

  /**
   * Open only the ancestors of the active lesson. Skip when the tree does not contain this lesson yet
   * (stale curriculum after course switch). Do not re-run on progress-only sidebar updates for the same lesson.
   */
  useEffect(() => {
    if (!sidebarTree?.sections?.length || !lessonId) return

    const nextSec = new Set<string>()
    const nextSub = new Set<string>()
    for (const sec of sidebarTree.sections) {
      for (const sub of sec.subsections) {
        if (sub.lessons.some((l) => l.id === lessonId)) {
          nextSec.add(sec.id)
          nextSub.add(sub.id)
        }
      }
    }
    if (nextSec.size === 0) return

    const lessonChanged = accordionLessonRef.current !== lessonId
    if (!lessonChanged && accordionLessonRef.current !== null) return
    accordionLessonRef.current = lessonId
    setExpandedSections(nextSec)
    setExpandedSubsections(nextSub)
  }, [lessonId, sidebarTree])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const toggleSubsection = (subsectionId: string) => {
    setExpandedSubsections((prev) => {
      const next = new Set(prev)
      if (next.has(subsectionId)) next.delete(subsectionId)
      else next.add(subsectionId)
      return next
    })
  }

  const subsectionLessonCount = (sub: CurriculumSubsection) => sub.lessons.length

  const sectionLessonCount = (sec: CurriculumSection) =>
    sec.subsections.reduce((n, sub) => n + subsectionLessonCount(sub), 0)

  const markComplete = async (completed: boolean) => {
    if (!courseId || !lessonId || !data?.enrolled) return
    setSaving(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, progress: completed ? 100 : 0 }),
      })
      if (res.ok) {
        const row = await res.json()
        setData((prev) =>
          prev
            ? {
                ...prev,
                progress: { completed: row.completed, progress: row.progress },
              }
            : prev
        )
        if (sidebarTree) {
          setSidebarTree((tree) => {
            if (!tree) return tree
            return {
              sections: tree.sections.map((sec) => ({
                ...sec,
                subsections: sec.subsections.map((sub) => ({
                  ...sub,
                  lessons: sub.lessons.map((l) =>
                    l.id === lessonId
                      ? { ...l, completed: row.completed, progress: row.progress }
                      : l
                  ),
                })),
              })),
            }
          })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const goLesson = (id: string | null) => {
    if (!id || !courseId) return
    router.push(`/courses/${courseId}/learn/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <p className="text-slate-700 mb-4">{error || 'Lesson not found'}</p>
        {courseId && (
          <Link href={`/courses/${courseId}`} className="text-primary font-medium hover:underline">
            Back to course
          </Link>
        )}
      </div>
    )
  }

  const { course, lesson, navigation, enrolled, progress } = data
  const contentUrl = lesson.content?.trim() || ''
  const yt = lesson.type === 'video' ? getYouTubeEmbedUrl(contentUrl) : null
  const nativeVideo =
    lesson.type === 'video' && !yt && /\.(mp4|webm|ogg)(\?|$)/i.test(contentUrl)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white lg:min-h-screen lg:sticky lg:top-0 lg:max-h-screen overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center text-sm text-slate-600 hover:text-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Course overview
          </Link>
          <h2 className="font-bold text-slate-900 leading-tight">{course.title}</h2>
          {navigation.totalLessons > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Lesson {navigation.lessonIndex + 1} of {navigation.totalLessons}
            </p>
          )}
        </div>
        {sidebarTree && sidebarTree.sections.length > 0 ? (
          <nav className="p-2 pb-4">
            <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Curriculum</p>
            <div className="rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-200 bg-white">
              {sidebarTree.sections.map((section) => (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-left"
                  >
                    <span className="text-sm font-medium text-slate-800 line-clamp-2">{section.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {sectionLessonCount(section)} lessons
                      </span>
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedSections.has(section.id) && (
                    <div className="divide-y divide-slate-100">
                      {section.subsections.map((sub) => (
                        <div key={sub.id}>
                          <button
                            type="button"
                            onClick={() => toggleSubsection(sub.id)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 pl-4 bg-slate-100/90 hover:bg-slate-100 text-left border-b border-slate-100"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                                Subsection
                              </span>
                              <span className="text-xs font-medium text-slate-800 ml-1.5">{sub.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {subsectionLessonCount(sub)} lessons
                              </span>
                              {expandedSubsections.has(sub.id) ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {expandedSubsections.has(sub.id) && (
                            <ul className="bg-white">
                              {sub.lessons.map((l) => {
                                const active = l.id === lessonId
                                return (
                                  <li key={l.id}>
                                    <Link
                                      href={`/courses/${courseId}/learn/${l.id}`}
                                      className={`flex items-center gap-2 px-3 py-2 pl-4 text-sm border-b border-slate-50 last:border-b-0 ${
                                        active
                                          ? 'bg-primary/10 text-primary font-medium'
                                          : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className="text-slate-500 shrink-0 text-xs w-4 text-center">
                                        {lessonTypeIcon(l.type)}
                                      </span>
                                      <span className="flex-1 min-w-0 line-clamp-2 leading-snug">{l.title}</span>
                                      {l.completed ? (
                                        <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                                      ) : (
                                        <Circle className="w-4 h-4 shrink-0 text-slate-300" />
                                      )}
                                    </Link>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
        ) : (
          <p className="p-4 text-xs text-slate-500">
            {enrolled ? '' : 'Preview mode — enroll for full curriculum navigation.'}
          </p>
        )}
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
          {lesson.type !== 'quiz' && (
            <>
              <div className="mb-2 text-xs text-slate-500">
                {lesson.sectionTitle}
                <ChevronRight className="inline w-3 h-3 mx-1" />
                {lesson.subsectionTitle}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{lesson.title}</h1>
              {lesson.description && <p className="text-slate-600 mb-6">{lesson.description}</p>}
            </>
          )}

          <div
            className={
              lesson.type === 'quiz'
                ? 'mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
                : 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8'
            }
          >
            {lesson.type === 'video' && contentUrl && (
              <div className="aspect-video bg-black">
                {yt ? (
                  <iframe
                    title={lesson.title}
                    src={yt}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : nativeVideo ? (
                  <video src={contentUrl} className="w-full h-full" controls playsInline>
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                    <p className="text-sm text-white/80 mb-4">Open this video in a new tab (e.g. Vimeo or hosted file).</p>
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary rounded-lg font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open video
                    </a>
                  </div>
                )}
              </div>
            )}

            {lesson.type === 'document' && contentUrl && (
              <div className="flex flex-col min-h-[70vh] bg-slate-50">
                <iframe
                  title={lesson.title}
                  src={contentUrl}
                  className="w-full flex-1 min-h-[62vh] border-0 bg-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-slate-100 border-t border-slate-200 text-xs text-slate-600">
                  <span>If this area is blank, the file host may block embedding — use open in new tab.</span>
                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary shrink-0 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in new tab
                  </a>
                </div>
              </div>
            )}

            {lesson.type === 'quiz' && contentUrl && (
              <iframe
                title={lesson.title}
                src={`/embed/quizzes/${contentUrl}/take`}
                className="block w-full min-h-[min(85dvh,880px)] border-0 bg-slate-50"
              />
            )}

            {!contentUrl && (
              <div className="p-8 text-center text-slate-500">No content URL configured for this lesson.</div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!navigation.prevLessonId}
                onClick={() => goLesson(navigation.prevLessonId)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!navigation.nextLessonId}
                onClick={() => goLesson(navigation.nextLessonId)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next lesson
              </button>
            </div>

            {enrolled && (
              <div className="flex items-center gap-3">
                {progress?.completed ? (
                  <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => markComplete(true)}
                    className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Mark as complete'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
