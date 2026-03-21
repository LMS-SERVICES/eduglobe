import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

const formatDate = (value: Date | string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateMetadata({ params }: Props) {
  const post = await prisma.newsUpdate.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, isPublished: true },
  })

  if (!post || !post.isPublished) {
    return { title: 'News Update – EduGlobe Academy' }
  }

  return {
    title: `${post.title} – EduGlobe Academy`,
    description: post.excerpt || 'News update from EduGlobe Academy.',
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const post = await prisma.newsUpdate.findUnique({
    where: { slug: params.slug },
  })

  if (!post || !post.isPublished) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/news-updates" className="text-sm text-primary hover:underline">
        ← Back to news updates
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            {post.tag || 'Academy Update'}
          </span>
          <span className="text-xs text-slate-500">
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-primary-dark">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-3 text-slate-600">{post.excerpt}</p>
        )}

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="mt-6 w-full rounded-xl border border-slate-200 object-cover max-h-[420px]"
          />
        )}

        <article className="mt-8 whitespace-pre-wrap leading-7 text-slate-700">
          {post.content}
        </article>
      </div>
    </div>
  )
}
