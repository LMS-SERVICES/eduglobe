'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { uploadFileToApi } from '@/lib/upload-client'

export default function CreateNewsUpdatePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    tag: 'Academy Update',
    content: '',
    coverImage: '',
    isPublished: false,
    isLatest: false,
    latestUntil: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/news-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt || null,
          tag: formData.tag || null,
          content: formData.content,
          coverImage: formData.coverImage || null,
          isPublished: formData.isPublished,
          isLatest: formData.isLatest,
          latestUntil: formData.isLatest ? formData.latestUntil || null : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create news update')
        return
      }
      router.push('/admin/news-updates')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/news-updates" className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create News Update</h1>
          <p className="mt-1 text-gray-400">Add a new post for the website news section</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
          <textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tag</label>
          <input type="text" value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
            className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
          <textarea required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" rows={10} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cover image</label>
          <p className="text-xs text-gray-500 mb-2">Upload an image for the post header, or paste a link below.</p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              disabled={uploadingCover}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingCover(true)
                uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
                  .then(({ url }) => setFormData((p) => ({ ...p, coverImage: url })))
                  .catch((err: any) => setError(err?.message || 'Cover upload failed'))
                  .finally(() => setUploadingCover(false))
                e.currentTarget.value = ''
              }}
              className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light disabled:opacity-60"
            />
            {uploadingCover && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>}
          </div>
          <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste image link instead</summary>
            <input
              type="url"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://…"
            />
          </details>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="rounded border-dark-700" />
          Publish immediately
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={formData.isLatest} onChange={(e) => setFormData({ ...formData, isLatest: e.target.checked })} className="rounded border-dark-700" />
          Mark as latest post
        </label>
        {formData.isLatest && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Latest badge expiry</label>
            <input type="datetime-local" value={formData.latestUntil} onChange={(e) => setFormData({ ...formData, latestUntil: e.target.value })}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
          <Link href="/admin/news-updates" className="px-4 py-2 bg-dark-700 border border-dark-700 text-white rounded-lg hover:bg-dark-900">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
