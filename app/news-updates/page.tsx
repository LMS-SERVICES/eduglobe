export const metadata = {
  title: 'News Updates – EduGlobe Academy',
  description:
    'Latest news and updates from EduGlobe Academy and education sector.',
}

import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const formatDate = (value: Date | string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function NewsUpdatesPage() {
  const items = await prisma.newsUpdate.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  })
  const now = new Date()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">News Updates</h1>
      <p className="text-slate-600 max-w-2xl mb-8">
        Latest news, exam updates, and announcements from EduGlobe Academy.
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">No published updates yet. Please check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((news) => (
            <article
              key={news.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    {news.tag || 'Academy Update'}
                  </span>
                  {news.isLatest && (!news.latestUntil || new Date(news.latestUntil) > now) && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Latest Posted
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {formatDate(news.publishedAt || news.createdAt)}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-primary-dark">
                {news.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {news.excerpt || `${news.content.slice(0, 220)}${news.content.length > 220 ? '...' : ''}`}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Link href={`/news-updates/${news.slug}`} className="text-sm font-medium text-primary hover:underline">
                  Read more
                </Link>
                {news.latestUntil && news.isLatest && (
                  <span className="text-xs text-slate-500">
                    Latest until: {formatDate(news.latestUntil)}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
