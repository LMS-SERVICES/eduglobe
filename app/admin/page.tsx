'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Users, TrendingUp, TrendingDown, Tag } from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalCategories: number
  totalQuizzes: number
  publishedQuizzes: number
  totalUsers: number
  totalRevenue: number
  publishedCourses: number
  thisMonth: { courses: number; publishedCourses: number; users: number; quizzes: number; publishedQuizzes: number; categories: number; revenue: number; enrollments: number }
  lastMonth: { courses: number; publishedCourses: number; users: number; quizzes: number; publishedQuizzes: number; categories: number; revenue: number; enrollments: number }
  changes: { courses: number; publishedCourses: number; users: number; quizzes: number; publishedQuizzes: number; categories: number; revenue: number }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Courses', value: stats?.totalCourses || 0, change: stats?.changes?.courses || 0, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Published Courses', value: stats?.publishedCourses || 0, change: stats?.changes?.publishedCourses || 0, icon: BookOpen, color: 'bg-green-500' },
    { title: 'Total Quizzes', value: stats?.totalQuizzes || 0, change: stats?.changes?.quizzes || 0, icon: TrendingUp, color: 'bg-indigo-500' },
    { title: 'Published Quizzes', value: stats?.publishedQuizzes || 0, change: stats?.changes?.publishedQuizzes || 0, icon: TrendingUp, color: 'bg-teal-500' },
    { title: 'Categories', value: stats?.totalCategories || 0, change: stats?.changes?.categories || 0, icon: Tag, color: 'bg-amber-500' },
    { title: 'Total Users', value: stats?.totalUsers || 0, change: stats?.changes?.users || 0, icon: Users, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-gray-400">Welcome to the admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          const Trend = isPositive ? TrendingUp : TrendingDown
          return (
            <div key={i} className="bg-dark-800 rounded-lg p-6 border border-dark-700 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                <Trend className="w-4 h-4" />
                <span className="text-sm font-semibold">{isPositive ? '+' : ''}{stat.change.toFixed(1)}%</span>
                <span className="text-gray-500 text-xs ml-1">vs last month</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/courses" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <BookOpen className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Manage Courses</h3>
            <p className="text-sm text-gray-400 mt-1">Add, edit, or delete courses</p>
          </a>
          <a href="/admin/users" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <Users className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Manage Users</h3>
            <p className="text-sm text-gray-400 mt-1">View and manage all users</p>
          </a>
          <a href="/admin/courses/create" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <TrendingUp className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Add New Course</h3>
            <p className="text-sm text-gray-400 mt-1">Create a new course</p>
          </a>
          <a href="/admin/academic-courses/create" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <BookOpen className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Add Academic Course</h3>
            <p className="text-sm text-gray-400 mt-1">Create academic courses and batches</p>
          </a>
          <a href="/admin/categories" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <Tag className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Manage Categories</h3>
            <p className="text-sm text-gray-400 mt-1">Add, edit, or delete categories</p>
          </a>
          <a href="/admin/academic-categories" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <Tag className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Academic Categories</h3>
            <p className="text-sm text-gray-400 mt-1">Manage academic categories</p>
          </a>
          <a href="/admin/quizzes" className="p-4 border border-dark-700 rounded-lg hover:bg-dark-900 hover:border-primary/50 transition-colors">
            <TrendingUp className="w-6 h-6 text-primary-400 mb-2" />
            <h3 className="font-semibold text-white">Manage Quizzes</h3>
            <p className="text-sm text-gray-400 mt-1">Create, publish, and review quizzes</p>
          </a>
        </div>
      </div>
    </div>
  )
}
