import Link from "next/link";
import { POPULAR_COURSES, LMS_PORTAL_URL } from "@/lib/constants";

export function PopularCourses() {
  return (
    <section id="popular-courses" className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-primary-dark mb-2">Popular Courses</h2>
        <p className="text-slate-600 mb-10 max-w-2xl">
          Enroll in our most sought-after courses for TET, DSC, and subject mastery. Start learning with structured content and exam-focused practice.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_COURSES.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              <div className="h-36 bg-gradient-to-br from-primary/10 to-primary-light/10 flex items-center justify-center text-5xl">
                {course.id === "tet" && "📚"}
                {course.id === "dsc" && "🎯"}
                {course.id === "math" && "📐"}
                {course.id === "english" && "📝"}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-primary-dark text-lg">{course.title}</h3>
                <p className="text-sm text-slate-600 mt-2 flex-1">{course.description}</p>
                <a
                  href={LMS_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent-orange text-white font-medium text-sm hover:bg-orange-600 transition"
                >
                  Enroll Now
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/popular-courses"
            className="inline-flex items-center text-primary font-semibold hover:underline"
          >
            View all courses
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
