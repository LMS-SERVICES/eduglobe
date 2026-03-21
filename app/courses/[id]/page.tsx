'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Clock, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

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
  sections: {
    id: string
    title: string
    order: number
    lessons: {
      id: string
      title: string
      duration: string
      type: string
      isPreview: boolean
    }[]
  }[]
  whatYouWillLearn: { id: string; content: string }[]
  requirements: { id: string; content: string }[]
  rating?: { averageRating: number; totalReviews: number } | null
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return
    fetch(`/api/courses/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setCourse(data)
        if (data?.sections?.[0]) {
          setExpandedSections(new Set([data.sections[0].id]))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
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
                <button className="w-full py-3 bg-accent-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                  Enroll Now
                </button>
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
                        <span className="text-xs text-slate-500">{section.lessons.length} lessons</span>
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {expandedSections.has(section.id) && (
                      <div className="divide-y divide-slate-100">
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between px-5 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                {lesson.type === 'video' ? '▶' : lesson.type === 'document' ? '📄' : '❓'}
                              </span>
                              <span className="text-slate-700">{lesson.title}</span>
                              {lesson.isPreview && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">Preview</span>
                              )}
                            </div>
                            <span className="text-slate-400 text-xs">{lesson.duration}</span>
                          </div>
                        ))}
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
