'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

interface AcademicCategory {
  id: string
  name: string
  slug: string
}

interface AcademicCourse {
  id: string
  title: string
  description: string
  thumbnail?: string | null
  level?: string | null
  duration?: string | null
  price: number
  category: { name: string; slug: string }
}

export default function AcademicCoursePage() {
  const [categories, setCategories] = useState<AcademicCategory[]>([])
  const [courses, setCourses] = useState<AcademicCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetch('/api/academic-categories').then((r) => (r.ok ? r.json() : [])).then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('category', selectedCategory)
    fetch(`/api/academic-courses?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [search, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">Academic Courses</h1>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Structured academic support for school students in Mathematics, English, and core foundation subjects.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search academic courses..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No academic courses available right now.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <article key={course.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  {course.category.name}
                </span>
                {course.level && <span className="text-xs text-slate-500">{course.level}</span>}
              </div>
              <h2 className="text-lg font-semibold text-primary-dark">{course.title}</h2>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{course.description}</p>
              <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-3">
                <span>{course.duration || 'Self-paced'}</span>
                <span>{course.price > 0 ? `INR ${course.price}` : 'Free'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
