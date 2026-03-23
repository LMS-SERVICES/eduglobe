'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react'
import { toastError, toastSuccess } from '@/lib/toast'

interface AcademicCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  _count?: { courses: number }
}

export default function AdminAcademicCategoriesPage() {
  const [items, setItems] = useState<AcademicCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AcademicCategory | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/academic-categories')
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const onOpen = (item?: AcademicCategory) => {
    if (item) {
      setEditing(item)
      setFormData({ name: item.name, description: item.description || '' })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '' })
    }
    setError('')
    setShowForm(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const url = editing ? `/api/admin/academic-categories/${editing.id}` : '/api/admin/academic-categories'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, description: formData.description || null }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      toastError('Could not save', data.error || 'Please check the form and try again.')
      return
    }
    toastSuccess(editing ? 'Category updated' : 'Category created', 'Your changes are saved.')
    setShowForm(false)
    await fetchItems()
  }

  const onDelete = async (item: AcademicCategory) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    const res = await fetch(`/api/admin/academic-categories/${item.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      toastError('Could not delete', data.error || 'Please try again.')
      return
    }
    toastSuccess('Category deleted', `"${item.name}" has been removed.`)
    await fetchItems()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Academic Categories</h1>
          <p className="mt-2 text-gray-400">Manage academic course categories</p>
        </div>
        <button onClick={() => onOpen()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Academic Category' : 'Add Academic Category'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded text-sm">{error}</div>}
              <div>
                <label className="text-sm text-gray-300 block mb-2">Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3} className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-dark-700 rounded-lg text-white hover:bg-dark-900">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary rounded-lg text-white hover:bg-primary-light flex items-center gap-2">
                  <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-3" />
            No academic categories yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-dark-900 border-b border-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Courses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-dark-900">
                  <td className="px-6 py-4 text-white">{item.name}</td>
                  <td className="px-6 py-4 text-gray-400">{item.description || '—'}</td>
                  <td className="px-6 py-4 text-gray-400">{item._count?.courses || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onOpen(item)} className="p-2 text-primary-400 hover:bg-primary/10 rounded"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(item)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
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
