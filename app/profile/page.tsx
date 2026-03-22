'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Edit2,
  Save,
  X,
  BarChart3,
} from 'lucide-react'

interface ProfileData {
  user: {
    id: string
    name: string | null
    email: string
    mobileNumber: string | null
    image: string | null
    role: string
    createdAt: string
  }
  enrollments: Array<{
    id: string
    enrolledAt: string
    completedLessons: number
    totalLessons: number
    progressPercentage: number
    course: {
      id: string
      title: string
      slug: string
      thumbnail: string
      description: string
      duration: string
      language: string
      price: number
      lecturesCount: number
      category: {
        name: string
      }
      instructor: {
        name: string
      }
    }
  }>
  quizEnrollments: Array<{
    id: string
    enrolledAt: string
    completedAt: string | null
    score: number | null
    percentage: number | null
    quiz: {
      id: string
      title: string
      description: string | null
      thumbnail: string | null
      totalMarks?: number | null
    }
  }>
  stats: {
    totalCourses: number
    totalQuizzes: number
    completedQuizzes: number
    completedCourses: number
    totalLessonsCompleted: number
    totalLessonsAvailable: number
    overallCourseProgress: number
    averageQuizScore: number
    lastActiveAt: string
  }
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editName, setEditName] = useState('')
  const [editMobileNumber, setEditMobileNumber] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callback=/profile')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfileData(data)
      setEditName(data.user.name || '')
      setEditMobileNumber(data.user.mobileNumber || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setError('')
    setSuccess('')

    if (editMobileNumber && !/^\d{10}$/.test(editMobileNumber)) {
      setError('Mobile number must be exactly 10 digits')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          mobileNumber: editMobileNumber || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfileData((prev) => (prev ? { ...prev, user: data.user } : null))
      setIsEditing(false)
      setSuccess('Profile updated successfully!')
      await update()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError('')
    setSuccess('')
    setEditName(profileData?.user.name || '')
    setEditMobileNumber(profileData?.user.mobileNumber || '')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData || !session) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-primary rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary font-bold text-3xl shadow-lg">
                {profileData.user.name?.charAt(0).toUpperCase() || profileData.user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{profileData.user.name || 'User'}</h1>
                <p className="text-white/80">{profileData.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
              className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 font-medium shadow-md"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs text-gray-400 mb-1">Courses</p>
            <p className="text-2xl font-bold text-white">{profileData.stats.totalCourses}</p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs text-gray-400 mb-1">Completed Courses</p>
            <p className="text-2xl font-bold text-primary-400">{profileData.stats.completedCourses}</p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs text-gray-400 mb-1">Lessons Done</p>
            <p className="text-2xl font-bold text-white">
              {profileData.stats.totalLessonsCompleted}/{profileData.stats.totalLessonsAvailable}
            </p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs text-gray-400 mb-1">Overall Progress</p>
            <p className="text-2xl font-bold text-primary-400">{profileData.stats.overallCourseProgress}%</p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs text-gray-400 mb-1">Quiz Avg Score</p>
            <p className="text-2xl font-bold text-white">{profileData.stats.averageQuizScore}%</p>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 shadow-xl">
            <p className="text-xs text-gray-400 mb-1">Last Active</p>
            <p className="text-sm font-semibold text-white">{formatDate(profileData.stats.lastActiveAt)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg">{success}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-900 rounded-xl p-6 border border-dark-700 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" />
                Personal Information
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.user.email}
                      disabled
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">+91</span>
                      <input
                        type="tel"
                        value={editMobileNumber}
                        onChange={(e) => setEditMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-12 pr-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Mail className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">{profileData.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Phone className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-500">Mobile</p>
                      <p className="text-sm">{profileData.user.mobileNumber ? `+91 ${profileData.user.mobileNumber}` : 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm">{formatDate(profileData.user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-dark-900 rounded-xl p-6 border border-dark-700 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-400" />
                Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Enrolled Courses</span>
                  <span className="text-xl font-bold text-white">{profileData.stats.totalCourses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Enrolled Quizzes</span>
                  <span className="text-xl font-bold text-white">{profileData.stats.totalQuizzes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completed Quizzes</span>
                  <span className="text-xl font-bold text-primary-400">{profileData.stats.completedQuizzes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Overall Course Progress</span>
                  <span className="text-xl font-bold text-white">{profileData.stats.overallCourseProgress}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Quiz Score</span>
                  <span className="text-xl font-bold text-white">{profileData.stats.averageQuizScore}%</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-900 rounded-xl p-6 border border-dark-700 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Account Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-semibold text-white">{profileData.user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Lessons</span>
                  <span className="font-semibold text-white">{profileData.stats.totalLessonsAvailable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Lessons</span>
                  <span className="font-semibold text-white">{profileData.stats.totalLessonsCompleted}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-dark-900 rounded-xl p-6 border border-dark-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary-400" />
                My Courses ({profileData.enrollments.length})
              </h2>
              {profileData.enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">You haven&apos;t enrolled in any courses yet</p>
                  <Link href="/courses" className="inline-block px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all font-medium">
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.enrollments.map((enrollment) => (
                    <Link
                      key={enrollment.id}
                      href={`/courses/${enrollment.course.id}`}
                      className="block bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-primary-500 transition-all group"
                    >
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-dark-700">
                          <Image src={enrollment.course.thumbnail} alt={enrollment.course.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors truncate">
                            {enrollment.course.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">by {enrollment.course.instructor.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary-300">
                              {enrollment.course.category.name}
                            </span>
                            <span className="text-xs text-gray-500">{enrollment.course.language}</span>
                            <span className="text-xs text-gray-500">{enrollment.course.duration}</span>
                            <span className="text-xs text-gray-500">{enrollment.course.lecturesCount} lessons</span>
                            <span className="text-xs font-semibold text-gray-300">
                              {enrollment.course.price > 0 ? `INR ${enrollment.course.price}` : 'Free'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Enrolled {formatDate(enrollment.enrolledAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-primary-400 font-semibold">{enrollment.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-dark-700 rounded-full h-2">
                              <div className="bg-gradient-primary h-2 rounded-full transition-all" style={{ width: `${enrollment.progressPercentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-dark-900 rounded-xl p-6 border border-dark-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-primary-400" />
                My Quizzes ({profileData.quizEnrollments.length})
              </h2>
              {profileData.quizEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">You haven&apos;t enrolled in any quizzes yet</p>
                  <Link href="/quizzes" className="inline-block px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all font-medium">
                    Browse Quizzes
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.quizEnrollments.map((enrollment) => (
                    <Link key={enrollment.id} href={`/quizzes/${enrollment.quiz.id}`} className="bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-primary-500 transition-all group">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                        {enrollment.quiz.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        {enrollment.completedAt ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        )}
                      </div>
                      {enrollment.completedAt && enrollment.score !== null && (
                        <div className="text-sm">
                          <span className="text-gray-400">Score: </span>
                          <span className="text-primary-400 font-semibold">
                            {enrollment.score} ({enrollment.percentage?.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      {enrollment.quiz.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2">{enrollment.quiz.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Enrolled {formatDate(enrollment.enrolledAt)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
