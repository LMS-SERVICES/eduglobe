'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

interface Paper {
  id: string
  title: string
  year?: number | null
  subject?: string | null
  format?: string | null
  isPublished: boolean
  isLatest: boolean
  category: { name: string }
  coverImageUrl?: string | null
}

export default function AdminPreviousPapersPage() {
  const [items, setItems] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/previous-papers')
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const toggle = async (item: Paper) => {
    const res = await fetch(`/api/admin/previous-papers/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !item.isPublished }),
    })
    if (res.ok) fetchItems()
  }

  const del = async (item: Paper) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    const res = await fetch(`/api/admin/previous-papers/${item.id}`, { method: 'DELETE' })
    if (res.ok) fetchItems()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Previous Year Papers</h1>
          <p className="mt-2 text-gray-400">Manage paper library with image support</p>
        </div>
        <Link href="/admin/previous-papers/create" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Paper
        </Link>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No papers yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-dark-900 border-b border-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-dark-900">
                  <td className="px-6 py-4 text-white">
                    <div className="flex items-center gap-2">
                      {item.coverImageUrl ? <ImageIcon className="w-4 h-4 text-primary-400" /> : null}
                      <span>{item.title}</span>
                      {item.isLatest && <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Latest</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.subject || 'All Subjects'} • {item.format || 'PDF'}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{item.category.name}</td>
                  <td className="px-6 py-4 text-gray-400">{item.year || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs border ${item.isPublished ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggle(item)} className="p-2 text-gray-300 hover:bg-dark-700 rounded" title={item.isPublished ? 'Unpublish' : 'Publish'}>
                        {item.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Link href={`/admin/previous-papers/${item.id}/edit`} className="p-2 text-primary-400 hover:bg-primary/10 rounded"><Edit className="w-4 h-4" /></Link>
                      <button onClick={() => del(item)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
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
