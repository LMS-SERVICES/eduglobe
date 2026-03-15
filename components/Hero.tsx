import Link from "next/link";
import { SITE, LMS_PORTAL_URL } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative bg-primary overflow-hidden">
      {/* Decorative elements – books, caps, gears feel */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-[10%] text-6xl">📚</div>
        <div className="absolute top-32 right-[15%] text-5xl">🎓</div>
        <div className="absolute bottom-24 left-[20%] text-4xl">✏️</div>
        <div className="absolute bottom-32 right-[25%] text-5xl">🌐</div>
        <div className="absolute top-1/2 left-[5%] text-3xl">📐</div>
        <div className="absolute top-1/3 right-[8%] text-4xl">🔬</div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              {SITE.name}
            </h1>
            <p className="mt-4 text-xl text-white/90 max-w-xl mx-auto lg:mx-0">
              {SITE.heroTagline}
            </p>
            <p className="mt-2 text-white/70 text-sm">
              {SITE.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/popular-courses"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition shadow-lg"
              >
                Explore Courses
              </Link>
              <a
                href={LMS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-dark text-white font-semibold border-2 border-white/30 hover:bg-white/10 transition"
              >
                Enroll Now
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end gap-6">
            {/* Illustration placeholder – students + globe/trophy style */}
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center text-white/90">
                <div className="w-24 h-28 rounded-2xl bg-white/20 flex items-center justify-center text-5xl mb-2">
                  📖
                </div>
                <span className="text-xs font-medium">Learn</span>
              </div>
              <div className="flex flex-col items-center text-white/90">
                <div className="w-24 h-28 rounded-2xl bg-white/20 flex items-center justify-center text-5xl mb-2">
                  📖
                </div>
                <span className="text-xs font-medium">Grow</span>
              </div>
            </div>
            <Link
              href="/achievements"
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium transition border border-white/20"
            >
              <span className="text-3xl">🏆</span>
              <div className="text-left">
                <span className="block text-sm font-bold">Achievements / Badges</span>
                <span className="block text-xs text-white/80">Track your progress</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Feature cards below hero */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4 max-w-4xl">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 text-white">
            <span className="text-3xl shrink-0">🏫</span>
            <div>
              <h3 className="font-semibold">EduGlobe Academy</h3>
              <p className="text-sm text-white/80 mt-1">
                Structured learning resources and expert guidance for TET, DSC, and competitive exams.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 text-white">
            <span className="text-3xl shrink-0">📋</span>
            <div>
              <h3 className="font-semibold">Syllabus & Notifications</h3>
              <p className="text-sm text-white/80 mt-1">
                Stay updated with syllabus, exam notifications, and previous year papers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
