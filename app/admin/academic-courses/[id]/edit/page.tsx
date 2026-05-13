'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { uploadFileToApi } from '@/lib/upload-client'

interface Category { id: string; name: string }

export default function EditAcademicCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    price: 0,
    duration: '',
    level: '',
    categoryId: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch('/api/admin/academic-categories').then((r) => (r.ok ? r.json() : [])).then(setCategories).catch(() => {})
    fetch(`/api/admin/academic-courses/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          setError(d.error)
          return
        }
        setForm({
          title: d.title || '',
          description: d.description || '',
          thumbnail: d.thumbnail || '',
          price: Number(d.price || 0),
          duration: d.duration || '',
          level: d.level || '',
          categoryId: d.categoryId || '',
          isPublished: !!d.isPublished,
        })
      })
      .catch(() => setError('Failed to load course'))
      .finally(() => setLoading(false))
  }, [params.id])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/academic-courses/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update')
        return
      }
      router.push('/admin/academic-courses')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/academic-courses" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Academic Course</h1>
          <p className="mt-1 text-gray-400">Update academic course details</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Description *</label>
          <textarea required rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Category *</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Price (INR)</label>
            <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Level</label>
            <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Duration</label>
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Thumbnail image</label>
          <p className="text-xs text-gray-500 mb-2">Upload a new image, or paste a link below.</p>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingThumb}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setUploadingThumb(true)
              uploadFileToApi({ endpoint: '/api/upload/thumbnail', file })
                .then(({ url }) => setForm((p) => ({ ...p, thumbnail: url })))
                .catch((err: any) => setError(err?.message || 'Upload failed'))
                .finally(() => setUploadingThumb(false))
              e.currentTarget.value = ''
            }}
            className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light disabled:opacity-60"
          />
          {uploadingThumb && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
          <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste image link instead</summary>
            <input
              type="url"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white"
              placeholder="https://…"
            />
          </details>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Publish
        </label>
        <div className="flex justify-end gap-3 pt-3 border-t border-dark-700">
          <Link href="/admin/academic-courses" className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-900">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  )
}
