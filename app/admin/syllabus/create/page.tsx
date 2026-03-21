'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface Category { id: string; name: string }

export default function CreateSyllabusPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
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
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latestUntil: form.isLatest ? form.latestUntil || null : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create item')
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/syllabus" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Syllabus Item</h1>
          <p className="mt-1 text-gray-400">Add notifications or syllabus points for categories like Telangana TET</p>
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
          <input value={form.eventDateText} onChange={(e) => setForm({ ...form, eventDateText: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" placeholder="e.g., Expected: June 2026" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Summary</label>
          <textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Content / Details</label>
          <textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white" />
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
          Publish immediately
        </label>
        <div className="flex justify-end gap-3 pt-3 border-t border-dark-700">
          <Link href="/admin/syllabus" className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-900">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}
