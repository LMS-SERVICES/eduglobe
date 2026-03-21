import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Notification and Syllabus – EduGlobe Academy',
  description: 'Exam notifications, syllabus, and updates for TET, DSC, and competitive exams.',
}

export default async function NotificationSyllabusPage() {
  const categories = await prisma.category.findMany({
    include: {
      syllabi: {
        where: { isPublished: true },
        orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
      },
    },
    orderBy: { name: 'asc' },
  })

  const now = new Date()
  const allItems = categories.flatMap((c) => c.syllabi.map((s) => ({ ...s, categoryName: c.name })))
  const notifications = allItems.filter((i) => i.type === 'NOTIFICATION')
  const syllabi = allItems.filter((i) => i.type === 'SYLLABUS')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">
        Notification and Syllabus
      </h1>
      <p className="text-slate-600 mb-10 max-w-2xl">
        Stay updated with latest exam notifications, official syllabus, and
        important dates. Below are sample notifications and syllabus sections
        to show how updates will appear in the portal.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary-dark mb-4">
          Latest / Upcoming Notifications
        </h2>
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
            No notification updates yet.
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-primary mb-1">
                {item.categoryName}
              </p>
              <h3 className="font-semibold text-primary-dark">{item.title}</h3>
              <p className="text-sm text-slate-600 mt-2">{item.eventDateText || 'Upcoming'}</p>
              <span className="inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                {item.isLatest && (!item.latestUntil || new Date(item.latestUntil) > now) ? 'Latest' : 'Updated'}
              </span>
              {item.summary && <p className="mt-3 text-xs text-slate-500">{item.summary}</p>}
            </div>
          ))}
        </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-primary-dark mb-4">
          Syllabus Overview
        </h2>
        {syllabi.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
            No syllabus entries yet.
          </div>
        ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {syllabi.map((section) => (
            <div
              key={section.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="font-semibold text-primary-dark mb-2">
                {section.title}
              </h3>
              <p className="text-xs text-primary mb-2">{section.categoryName}</p>
              {section.summary && <p className="text-sm text-slate-600 mb-3">{section.summary}</p>}
              {section.content && (
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-6">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>
        )}
      </section>
    </div>
  )
}
