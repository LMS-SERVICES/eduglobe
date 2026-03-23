'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Clock, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import RazorpayCheckout from '@/components/RazorpayCheckout'
import { toastError, toastSuccess } from '@/lib/toast'

type LessonRow = {
  id: string
  title: string
  duration: string
  type: string
  isPreview: boolean
}

/** New: section → subsections → lessons. Legacy: section.lessons only */
type CourseSection = {
  id: string
  title: string
  order: number
  lessons?: LessonRow[]
  subsections?: { id: string; title: string; order: number; lessons: LessonRow[] }[]
}

function sectionLessonCount(section: CourseSection): number {
  if (section.subsections?.length) {
    return section.subsections.reduce((n, sub) => n + (sub.lessons?.length || 0), 0)
  }
  return section.lessons?.length || 0
}

interface Course {
  id: string
  title: string
  description: string
  descriptionFull: string
  thumbnail: string
  price: number
  originalPrice?: number
  language: string
  duration: string
  timeline?: string
  lecturesCount: number
  studentsCount: number
  instructor: { name: string; bio?: string; image?: string }
  category: { name: string }
  sections: CourseSection[]
  whatYouWillLearn: { id: string; content: string }[]
  requirements: { id: string; content: string }[]
  rating?: { averageRating: number; totalReviews: number } | null
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/courses/${id}`).then((r) => (r.ok ? r.json() : null)),
      session ? fetch(`/api/courses/${id}/enrollment`).then((r) => (r.ok ? r.json() : { enrolled: false })) : Promise.resolve({ enrolled: false }),
    ])
      .then(([data, enrollmentData]) => {
        setCourse(data)
        setEnrolled(!!enrollmentData?.enrolled)
        if (data?.sections?.[0]) {
          const first = data.sections[0]
          setExpandedSections(new Set([first.id]))
          const subIds = first.subsections?.map((s: { id: string }) => s.id) ?? []
          setExpandedSubsections(new Set(subIds))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, session])

  const handleFreeEnroll = async () => {
    if (!id) return
    setEnrolling(true)
    try {
      const res = await fetch(`/api/courses/${id}/enroll`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toastError('Could not enroll', data?.error || 'Please try again.')
        return
      }
      setEnrolled(true)
      toastSuccess('You are enrolled', 'Continue learning from this page.')
    } finally {
      setEnrolling(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Course Not Found</h2>
          <Link href="/courses" className="text-primary hover:text-primary-light">Browse all courses</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-primary text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/courses" className="inline-flex items-center text-white/80 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <span className="px-3 py-1 bg-white/20 rounded-md text-sm mb-4 inline-block">{course.category.name}</span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-white/80 text-lg mb-6">{course.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.lecturesCount} lessons</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.studentsCount} students</span>
                {course.rating && course.rating.averageRating > 0 && (
                  <span>★ {course.rating.averageRating.toFixed(1)} ({course.rating.totalReviews} reviews)</span>
                )}
              </div>
              <div className="mt-4 text-sm text-white/70">
                Instructor: <span className="text-white font-medium">{course.instructor.name}</span>
                {course.language && <span className="ml-4">Language: {course.language}</span>}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 text-slate-800">
                <div className="relative h-40 rounded-lg overflow-hidden mb-4 bg-slate-100">
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="400px" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl font-bold text-primary">₹{course.price.toFixed(0)}</span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-lg text-slate-400 line-through">₹{course.originalPrice.toFixed(0)}</span>
                  )}
                </div>
                {course.timeline && (
                  <p className="text-sm text-slate-500 mb-4">Duration: {course.timeline}</p>
                )}
                {enrolled ? (
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition-colors"
                  >
                    Continue learning
                  </Link>
                ) : course.price > 0 ? (
                  <RazorpayCheckout
                    entityType="course"
                    entityId={course.id}
                    title={course.title}
                    price={course.price}
                    onSuccess={() => setEnrolled(true)}
                    className="w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Enroll Now
                  </RazorpayCheckout>
                ) : (
                  <button
                    onClick={handleFreeEnroll}
                    disabled={enrolling}
                    className="w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.whatYouWillLearn.length > 0 && (
              <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">What You Will Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((point) => (
                    <div key={point.id} className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{point.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Content */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Course Content
                <span className="text-sm font-normal text-slate-500 ml-2">
                  {course.sections.length} sections · {course.lecturesCount} lessons
                </span>
              </h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                {course.sections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <span className="font-medium text-slate-800">{section.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{sectionLessonCount(section)} lessons</span>
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {expandedSections.has(section.id) && (
                      <div className="divide-y divide-slate-100">
                        {section.subsections?.length ? (
                          section.subsections.map((sub) => (
                            <div key={sub.id} className="border-b border-slate-100 last:border-b-0">
                              <button
                                type="button"
                                onClick={() => toggleSubsection(sub.id)}
                                className="w-full flex items-center justify-between px-5 py-3 pl-6 bg-slate-100/90 hover:bg-slate-100 transition-colors text-left border-b border-slate-200/80"
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Subsection</span>
                                  <span className="text-sm font-medium text-slate-800 ml-2">{sub.title}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-slate-500">{sub.lessons?.length || 0} lessons</span>
                                  {expandedSubsections.has(sub.id) ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </button>
                              {expandedSubsections.has(sub.id) && (
                                <div className="divide-y divide-slate-100 bg-white">
                                  {(sub.lessons || []).map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between px-5 py-3 pl-9 text-sm">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-slate-500 shrink-0">
                                          {lesson.type === 'video' ? '▶' : lesson.type === 'document' ? '📄' : '❓'}
                                        </span>
                                        {lesson.isPreview || enrolled ? (
                                          <Link
                                            href={`/courses/${course.id}/learn/${lesson.id}`}
                                            className="text-slate-700 hover:text-primary font-medium truncate"
                                          >
                                            {lesson.title}
                                          </Link>
                                        ) : (
                                          <span className="text-slate-700 truncate">{lesson.title}</span>
                                        )}
                                        {lesson.isPreview && (
                                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded shrink-0">Preview</span>
                                        )}
                                      </div>
                                      <span className="text-slate-400 text-xs shrink-0 ml-2">{lesson.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          (section.lessons || []).map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between px-5 py-3 text-sm">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-slate-500 shrink-0">
                                  {lesson.type === 'video' ? '▶' : lesson.type === 'document' ? '📄' : '❓'}
                                </span>
                                {lesson.isPreview || enrolled ? (
                                  <Link
                                    href={`/courses/${course.id}/learn/${lesson.id}`}
                                    className="text-slate-700 hover:text-primary font-medium truncate"
                                  >
                                    {lesson.title}
                                  </Link>
                                ) : (
                                  <span className="text-slate-700 truncate">{lesson.title}</span>
                                )}
                                {lesson.isPreview && (
                                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded shrink-0">Preview</span>
                                )}
                              </div>
                              <span className="text-slate-400 text-xs shrink-0 ml-2">{lesson.duration}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Description</h2>
              <div className="prose prose-slate max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: course.descriptionFull }} />
            </div>

            {/* Requirements */}
            {course.requirements.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req) => (
                    <li key={req.id} className="flex gap-2 text-slate-600">
                      <span className="text-slate-400">•</span>
                      {req.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar - Instructor */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">About the Instructor</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{course.instructor.name}</p>
                  <p className="text-sm text-slate-500">Instructor</p>
                </div>
              </div>
              {course.instructor.bio && (
                <p className="text-sm text-slate-600">{course.instructor.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
