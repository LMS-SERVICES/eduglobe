'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

interface Course {
  id: string
  title: string
  price: number
  level?: string | null
  isPublished: boolean
  category: { name: string }
}

export default function AdminAcademicCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/academic-courses')
      if (res.ok) setCourses(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const onDelete = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"?`)) return
    const res = await fetch(`/api/admin/academic-courses/${course.id}`, { method: 'DELETE' })
    if (res.ok) fetchCourses()
  }

  const onToggle = async (course: Course) => {
    const res = await fetch(`/api/admin/academic-courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    })
    if (res.ok) fetchCourses()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Academic Courses</h1>
          <p className="mt-2 text-gray-400">Manage academic courses</p>
        </div>
        <Link href="/admin/academic-courses/create" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Academic Course
        </Link>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No academic courses created yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-dark-900 border-b border-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-dark-900">
                  <td className="px-6 py-4 text-white">{course.title}</td>
                  <td className="px-6 py-4 text-gray-400">{course.category.name}</td>
                  <td className="px-6 py-4 text-gray-400">{course.level || '—'}</td>
                  <td className="px-6 py-4 text-gray-300">INR {Number(course.price || 0).toFixed(0)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs border ${course.isPublished ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onToggle(course)} className="p-2 text-gray-300 hover:bg-dark-700 rounded" title={course.isPublished ? 'Unpublish' : 'Publish'}>
                        {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Link href={`/admin/academic-courses/${course.id}/edit`} className="p-2 text-primary-400 hover:bg-primary/10 rounded"><Edit className="w-4 h-4" /></Link>
                      <button onClick={() => onDelete(course)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
