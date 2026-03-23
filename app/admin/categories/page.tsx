'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react'
import { toastError, toastSuccess } from '@/lib/toast'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  _count?: { courses: number }
  createdAt: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) setCategories(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, description: category.description || '', icon: category.icon || '' })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '', icon: '' })
    }
    setShowForm(true)
    setError('')
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '', icon: '' })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories'
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, description: formData.description || null, icon: formData.icon || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save category')
        toastError('Could not save category', data.error || 'Please check the form and try again.')
        return
      }
      toastSuccess(editingCategory ? 'Category updated' : 'Category created', 'Your changes are saved.')
      await fetchCategories()
      handleCloseForm()
    } catch { setError('Something went wrong') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toastError('Could not delete category', data.error || 'Please try again.')
        return
      }
      toastSuccess('Category deleted', `"${name}" has been removed.`)
      await fetchCategories()
    } catch {
      toastError('Something went wrong', 'Check your connection and try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="mt-2 text-gray-400">Manage course categories</p>
        </div>
        <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g., Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" rows={3} placeholder="Brief description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon/Emoji</label>
                <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g., 📚" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                <button type="button" onClick={handleCloseForm} className="px-4 py-2 bg-dark-700 border border-dark-700 text-white rounded-lg hover:bg-dark-900">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No Categories</h3>
            <p className="text-gray-400 mb-4">Get started by creating your first category</p>
            <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-900 border-b border-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Courses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-dark-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {category.icon && <span className="text-2xl">{category.icon}</span>}
                        <span className="text-sm font-medium text-white">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 max-w-xs truncate">{category.description || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary-400 rounded">{category._count?.courses || 0} courses</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 font-mono">{category.slug}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenForm(category)} className="p-2 text-primary-400 hover:bg-primary/10 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(category.id, category.name)} disabled={(category._count?.courses ?? 0) > 0}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title={(category._count?.courses ?? 0) > 0 ? 'Cannot delete: has courses' : 'Delete'}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
