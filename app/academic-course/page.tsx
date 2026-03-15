import { LMS_PORTAL_URL } from "@/lib/constants";

export const metadata = {
  title: "Academic Course – EduGlobe Academy",
  description: "Academic courses for school students. Concept-based learning in Mathematics and English.",
};

export default function AcademicCoursePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-4">Academic Course</h1>
      <p className="text-slate-600 mb-6 max-w-2xl">
        Structured academic support for school students with focus on Mathematics and English. Concept-based video classes, study notes, and practice materials.
      </p>
      <a href={LMS_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex px-5 py-2.5 rounded-lg bg-accent-orange text-white font-medium hover:bg-orange-600">
        Go to LMS Portal
      </a>
    </div>
  );
}
