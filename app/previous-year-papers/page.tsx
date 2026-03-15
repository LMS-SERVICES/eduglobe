import { LMS_PORTAL_URL } from "@/lib/constants";

export const metadata = {
  title: "Previous Year Questions Papers – EduGlobe Academy",
  description: "Previous year question papers with solutions for TET, DSC, and competitive exams.",
};

export default function PreviousYearPapersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-4">Previous Year Questions Papers</h1>
      <p className="text-slate-600 mb-6 max-w-2xl">
        Access previous year question papers with explanations to understand exam patterns and practice effectively.
      </p>
      <a href={LMS_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex px-5 py-2.5 rounded-lg bg-accent-orange text-white font-medium hover:bg-orange-600">
        Go to LMS Portal
      </a>
    </div>
  );
}
