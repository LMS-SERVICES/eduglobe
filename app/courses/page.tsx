'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  thumbnail: string
  price: number
  originalPrice?: number
  duration: string
  lecturesCount: number
  studentsCount: number
  instructor: { name: string; image?: string }
  category: { name: string; slug: string }
  rating?: { averageRating: number; totalReviews: number } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('popular')

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('category', selectedCategory)
    if (sortBy) params.set('sortBy', sortBy)

    fetch(`/api/courses?${params}`)
      .then((r) => r.json())
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-primary py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Explore Our Courses</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Structured preparation for TET, DSC, and competitive exams with expert guidance.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No courses found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
              >
                <div className="relative h-48 bg-slate-100">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-primary/90 text-white text-xs rounded-md font-medium">
                      {course.category.name}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <span>{course.instructor.name}</span>
                    <span className="text-slate-300">|</span>
                    <span>{course.lecturesCount} lessons</span>
                    <span className="text-slate-300">|</span>
                    <span>{course.studentsCount} students</span>
                  </div>
                  {course.rating && course.rating.averageRating > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-yellow-500 font-semibold">{course.rating.averageRating.toFixed(1)}</span>
                      <span className="text-yellow-500">★</span>
                      <span className="text-slate-400 text-sm">({course.rating.totalReviews})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">₹{course.price.toFixed(0)}</span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span className="text-sm text-slate-400 line-through">₹{course.originalPrice.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
