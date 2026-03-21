'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditQuizPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', details: '', thumbnail: '', price: 0, expiryDate: '', generateCertificate: false, isPublished: false })
  const [questionCount, setQuestionCount] = useState(0)

  useEffect(() => {
    fetch(`/api/admin/quizzes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          details: data.details || '',
          thumbnail: data.thumbnail || '',
          price: data.price || 0,
          expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().slice(0, 16) : '',
          generateCertificate: data.generateCertificate || false,
          isPublished: data.isPublished || false,
        })
        const count = data.sections?.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0) || 0
        setQuestionCount(count)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent, forceDraft = false) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isPublished: forceDraft ? false : form.isPublished,
          expiryDate: form.expiryDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to update quiz'); return }
      router.push('/admin/quizzes')
    } catch { setError('Something went wrong') }
    finally { setSaving(false) }
  }

  const ic = 'w-full px-4 py-2 bg-dark-900 border border-dark-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50'

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes" className="text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Quiz</h1>
          <p className="mt-1 text-gray-400">Update quiz details</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Quiz Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={ic} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Details</label>
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className={ic} rows={4} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL</label>
              <input type="url" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price (₹)</label>
              <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
              <input type="datetime-local" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={ic} />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded border-dark-700" />
                Published
              </label>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Questions</h2>
          <p className="text-gray-400 text-sm">This quiz has {questionCount} questions. Question editing is available during creation.</p>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/admin/quizzes" className="px-6 py-3 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700">Cancel</Link>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            className="px-6 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
            <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </form>
    </div>
  )
}
