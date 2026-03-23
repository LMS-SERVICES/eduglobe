'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Newspaper, Eye, EyeOff } from 'lucide-react'
import { toastError, toastSuccess } from '@/lib/toast'

interface NewsUpdate {
  id: string
  title: string
  slug: string
  tag?: string | null
  excerpt?: string | null
  content: string
  coverImage?: string | null
  isPublished: boolean
  isLatest: boolean
  latestUntil?: string | null
  publishedAt?: string | null
  createdAt: string
}

export default function AdminNewsUpdatesPage() {
  const [items, setItems] = useState<NewsUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/news-updates')
      if (res.ok) setItems(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      const res = await fetch(`/api/admin/news-updates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toastError('Could not delete', data.error || 'Please try again.')
        return
      }
      toastSuccess('News item deleted', `"${title}" has been removed.`)
      await fetchItems()
    } catch {
      toastError('Something went wrong', 'Check your connection and try again.')
    }
  }

  const togglePublish = async (item: NewsUpdate) => {
    try {
      const res = await fetch(`/api/admin/news-updates/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      })
      const data = await res.json()
      if (!res.ok) {
        toastError('Could not update status', data.error || 'Please try again.')
        return
      }
      toastSuccess(
        !item.isPublished ? 'Published' : 'Unpublished',
        !item.isPublished ? 'The article is visible on the site.' : 'The article is hidden from the site.'
      )
      await fetchItems()
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
          <h1 className="text-3xl font-bold text-white">News Updates</h1>
          <p className="mt-2 text-gray-400">Create and manage blog/news posts</p>
        </div>
        <Link href="/admin/news-updates/create" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Add News</span>
        </Link>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No News Updates</h3>
            <p className="text-gray-400 mb-4">Create your first update post</p>
            <Link href="/admin/news-updates/create" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add News
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-900 border-b border-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Latest Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Published At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-dark-900 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      {item.excerpt && <div className="text-xs text-gray-400 mt-1 max-w-lg truncate">{item.excerpt}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs border ${item.isPublished ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.tag || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {item.isLatest && item.latestUntil ? new Date(item.latestUntil).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => togglePublish(item)} className="p-2 text-gray-300 hover:bg-dark-700 rounded-lg" title={item.isPublished ? 'Unpublish' : 'Publish'}>
                          {item.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link href={`/admin/news-updates/${item.id}/edit`} className="p-2 text-primary-400 hover:bg-primary/10 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(item.id, item.title)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">
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
