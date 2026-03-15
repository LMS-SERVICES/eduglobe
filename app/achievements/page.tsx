import { LMS_PORTAL_URL } from "@/lib/constants";

export const metadata = {
  title: "Achievements / Badges – EduGlobe Academy",
  description: "Track your achievements and earn badges as you learn.",
};

export default function AchievementsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-4">Achievements / Badges</h1>
      <p className="text-slate-600 mb-6 max-w-2xl">
        Celebrate your progress with achievements and badges. Complete courses, quizzes, and mock tests to earn them.
      </p>
      <a href={LMS_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex px-5 py-2.5 rounded-lg bg-accent-orange text-white font-medium hover:bg-orange-600">
        View in LMS Portal
      </a>
    </div>
  );
}
