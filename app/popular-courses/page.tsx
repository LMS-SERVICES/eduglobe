import { POPULAR_COURSES, LMS_PORTAL_URL } from "@/lib/constants";

export const metadata = {
  title: "Popular Courses – EduGlobe Academy",
  description: "Explore TET, DSC, Mathematics, and English courses. Enroll and learn with structured content.",
};

export default function PopularCoursesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">Popular Courses</h1>
      <p className="text-slate-600 mb-10">Choose a course and start your preparation with EduGlobe Academy.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {POPULAR_COURSES.map((course) => (
          <div key={course.id} className="rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-primary-dark">{course.title}</h2>
            <p className="text-sm text-slate-600 mt-2">{course.description}</p>
            <a href={LMS_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block px-4 py-2 rounded-lg bg-accent-orange text-white font-medium text-sm hover:bg-orange-600">
              Enroll Now
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
