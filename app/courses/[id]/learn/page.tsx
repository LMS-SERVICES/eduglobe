'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CourseLearnEntryPage() {
  const { id } = useParams()
  const router = useRouter()
  const courseId = typeof id === 'string' ? id : id?.[0]

  useEffect(() => {
    if (!courseId) return
    const callback = encodeURIComponent(`/courses/${courseId}/learn`)
    fetch(`/api/courses/${courseId}/learn/state`)
      .then(async (r) => {
        if (r.status === 401) {
          router.replace(`/login?callback=${callback}`)
          return null
        }
        if (r.status === 403) {
          router.replace(`/courses/${courseId}`)
          return null
        }
        if (!r.ok) {
          router.replace(`/courses/${courseId}`)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (!data?.continueLessonId) {
          router.replace(`/courses/${courseId}`)
          return
        }
        router.replace(`/courses/${courseId}/learn/${data.continueLessonId}`)
      })
      .catch(() => router.replace(`/courses/${courseId}`))
  }, [courseId, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      <p className="text-sm text-slate-600">Opening your lesson…</p>
    </div>
  )
}
