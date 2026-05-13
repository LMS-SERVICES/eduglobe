'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { uploadFileToApi } from '@/lib/upload-client'

interface Category { id: string; name: string }

const toInputDateTime = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditPreviousPaperPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPaper, setUploadingPaper] = useState(false)
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    year: new Date().getFullYear(),
    subject: '',
    format: 'PDF',
    description: '',
    coverImageUrl: '',
    paperUrl: '',
    isLatest: false,
    latestUntil: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => (r.ok ? r.json() : [])).then(setCategories).catch(() => {})
    fetch(`/api/admin/previous-papers/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          setError(d.error)
          return
        }
        setForm({
          title: d.title || '',
          categoryId: d.categoryId || '',
          year: d.year || new Date().getFullYear(),
          subject: d.subject || '',
          format: d.format || 'PDF',
          description: d.description || '',
          coverImageUrl: d.coverImageUrl || '',
          paperUrl: d.paperUrl || '',
          isLatest: !!d.isLatest,
          latestUntil: toInputDateTime(d.latestUntil),
          isPublished: !!d.isPublished,
        })
      })
      .catch(() => setError('Failed to load paper'))
      .finally(() => setLoading(false))
  }, [params.id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/previous-papers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latestUntil: form.isLatest ? form.latestUntil || null : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update')
        return
      }
      router.push('/admin/previous-papers')
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
        <Link href="/admin/previous-papers" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Previous Paper</h1>
          <p className="mt-1 text-gray-400">Upload new files or paste links for cover and paper.</p>
        </div>
      </div>
      <form onSubmit={submit} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Category *</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Year</label>
            <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) || new Date().getFullYear() })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Format</label>
            <input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Subject</label>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Cover image</label>
          <p className="text-xs text-gray-500 mb-2">Upload a new cover, or paste a link below.</p>
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
                  .then(({ url }) => setForm((p) => ({ ...p, coverImageUrl: url })))
                  .catch((err: any) => setError(err?.message || 'Cover upload failed'))
                  .finally(() => setUploadingCover(false))
                e.currentTarget.value = ''
              }}
              className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light disabled:opacity-60"
            />
            {uploadingCover && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>}
          </div>
          <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste cover image link instead</summary>
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white"
              placeholder="https://…"
            />
          </details>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Paper file</label>
          <p className="text-xs text-gray-500 mb-2">Upload a new paper, or paste a link below.</p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              disabled={uploadingPaper}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploadingPaper(true)
                const endpoint = file.type.startsWith('image/') ? '/api/upload/thumbnail' : '/api/upload/document'
                uploadFileToApi({ endpoint, file })
                  .then(({ url }) => setForm((p) => ({ ...p, paperUrl: url })))
                  .catch((err: any) => setError(err?.message || 'Paper upload failed'))
                  .finally(() => setUploadingPaper(false))
                e.currentTarget.value = ''
              }}
              className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-light disabled:opacity-60"
            />
            {uploadingPaper && <span className="text-xs text-gray-400 whitespace-nowrap">Uploading…</span>}
          </div>
          <details className="mt-3 rounded-lg border border-dark-600 bg-dark-900/50 px-3 py-2">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Paste paper link instead</summary>
            <input
              type="url"
              value={form.paperUrl}
              onChange={(e) => setForm({ ...form, paperUrl: e.target.value })}
              className="w-full mt-2 px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white"
              placeholder="https://…"
            />
          </details>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.isLatest} onChange={(e) => setForm({ ...form, isLatest: e.target.checked })} />
          Mark as latest
        </label>
        {form.isLatest && (
          <div>
            <label className="block text-sm text-gray-300 mb-2">Latest expiry</label>
            <input type="datetime-local" value={form.latestUntil} onChange={(e) => setForm({ ...form, latestUntil: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Publish
        </label>
        <div className="flex justify-end gap-3 pt-3 border-t border-dark-700">
          <Link href="/admin/previous-papers" className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-900">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update'}</button>
        </div>
      </form>
    </div>
  )
}
