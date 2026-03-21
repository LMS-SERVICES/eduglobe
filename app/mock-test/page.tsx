import { LMS_PORTAL_URL } from "@/lib/constants";

export const metadata = {
  title: "Mock Test – EduGlobe Academy",
  description: "Practice with mock tests for TET, DSC, and competitive exams.",
};

const DUMMY_MOCK_TESTS = [
  {
    name: "TET Paper I – Full Length Mock",
    duration: "150 minutes",
    questions: 150,
    level: "Beginner",
  },
  {
    name: "TET Paper II – Mathematics & Science Mock",
    duration: "150 minutes",
    questions: 150,
    level: "Intermediate",
  },
  {
    name: "DSC General Studies Mock Test",
    duration: "120 minutes",
    questions: 120,
    level: "Advanced",
  },
];

export default function MockTestPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-primary-dark mb-2">Mock Test</h1>
      <p className="text-slate-600 mb-8 max-w-2xl">
        Take full-length mock tests aligned with exam pattern. Below are sample
        mock tests to illustrate how the portal will list available exams.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {DUMMY_MOCK_TESTS.map((test) => (
          <div
            key={test.name}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-primary-dark">
              {test.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Duration: {test.duration}
            </p>
            <p className="text-sm text-slate-600">
              Number of Questions: {test.questions}
            </p>
            <span className="mt-3 inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
              Level: {test.level}
            </span>
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90"
            >
              Start Demo Mock
            </button>
          </div>
        ))}
      </div>

      <a
        href={LMS_PORTAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex px-5 py-2.5 rounded-lg bg-accent-orange text-white font-medium hover:bg-orange-600"
      >
        View All Mock Tests in LMS
      </a>
    </div>
  );
}
