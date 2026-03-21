'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'

interface Category { id: string; name: string }

const toInputDateTime = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditSyllabusPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    type: 'SYLLABUS',
    categoryId: '',
    summary: '',
    content: '',
    eventDateText: '',
    isLatest: false,
    latestUntil: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => (r.ok ? r.json() : [])).then(setCategories).catch(() => {})
    fetch(`/api/admin/syllabus/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          setError(d.error)
          return
        }
        setForm({
          title: d.title || '',
          type: d.type || 'SYLLABUS',
          categoryId: d.categoryId || '',
          summary: d.summary || '',
          content: d.content || '',
          eventDateText: d.eventDateText || '',
          isLatest: !!d.isLatest,
          latestUntil: toInputDateTime(d.latestUntil),
          isPublished: !!d.isPublished,
        })
      })
      .catch(() => setError('Failed to load syllabus item'))
      .finally(() => setLoading(false))
  }, [params.id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/syllabus/${params.id}`, {
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
      router.push('/admin/syllabus')
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
        <Link href="/admin/syllabus" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Syllabus Item</h1>
          <p className="mt-1 text-gray-400">Update syllabus/notification details</p>
        </div>
      </div>
      <form onSubmit={submit} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Type *</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white">
              <option value="SYLLABUS">SYLLABUS</option>
              <option value="NOTIFICATION">NOTIFICATION</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Category *</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Date / Label</label>
          <input value={form.eventDateText} onChange={(e) => setForm({ ...form, eventDateText: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Summary</label>
          <RichTextEditor
            value={form.summary}
            onChange={(value) => setForm({ ...form, summary: value })}
            placeholder="Add summary content..."
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Content / Details</label>
          <RichTextEditor
            value={form.content}
            onChange={(value) => setForm({ ...form, content: value })}
            placeholder="Write detailed content..."
            minHeightClassName="min-h-[220px]"
          />
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
          <Link href="/admin/syllabus" className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-900">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update'}</button>
        </div>
      </form>
    </div>
  )
}
