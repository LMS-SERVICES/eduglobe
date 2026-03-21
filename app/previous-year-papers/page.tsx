'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'

export const metadata = {
  title: 'Previous Year Questions Papers – EduGlobe Academy',
  description:
    'Previous year question papers with solutions for TET, DSC, and competitive exams.',
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Paper {
  id: string
  title: string
  year?: number | null
  subject?: string | null
  format?: string | null
  description?: string | null
  coverImageUrl?: string | null
  paperUrl?: string | null
  isLatest: boolean
  latestUntil?: string | null
  category: { name: string; slug: string }
}

export default function PreviousYearPapersPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetch('/api/previous-paper-categories').then((r) => (r.ok ? r.json() : [])).then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('category', selectedCategory)
    fetch(`/api/previous-papers?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPapers)
      .catch(() => setPapers([]))
      .finally(() => setLoading(false))
  }, [search, selectedCategory])

  const now = new Date()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">
        Previous Year Questions Papers
      </h1>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Access previous year question papers with explanations to understand
        exam patterns and practice effectively.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-lg bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : papers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No previous year papers available.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <article key={paper.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {paper.coverImageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden mb-4 bg-slate-100">
                  <Image src={paper.coverImageUrl} alt={paper.title} fill className="object-cover" />
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  {paper.category.name}
                </span>
                {paper.isLatest && (!paper.latestUntil || new Date(paper.latestUntil) > now) && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Latest
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-primary-dark">{paper.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {(paper.year || '—')} • {paper.subject || 'All Subjects'} • {paper.format || 'PDF'}
              </p>
              {paper.description && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{paper.description}</p>}
              {paper.paperUrl && (
                <a
                  href={paper.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-lg bg-primary text-white px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
                >
                  View Paper
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
