export function AboutAcademy() {
  return (
    <section id="about-academy" className="py-16 lg:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-primary-dark mb-8">About EduGlobe Academy</h2>
        <div className="max-w-3xl space-y-4 text-slate-700 leading-relaxed">
          <p>
            EduGlobe Academy is a dedicated educational platform that provides high-quality learning
            resources and structured guidance for students preparing for TET, DSC, and other
            competitive examinations, along with academic support for school students. Our academy
            focuses on concept-based learning, exam-oriented preparation, and clear subject
            understanding, especially in Mathematics and English.
          </p>
          <p>
            At EduGlobe Academy, we believe that strong concepts are the foundation for success in
            both academics and competitive exams. Our goal is to simplify complex topics and help
            students learn through clear explanations, practical examples, and structured study
            materials. We focus on building confidence, improving problem-solving skills, and
            helping students perform effectively in examinations.
          </p>
          <p>
            Our platform provides a wide range of learning resources: concept-based video classes,
            well-structured study notes, MCQs for practice, previous year questions with
            explanations, and important rules, shortcuts, and exam strategies for Mathematics and
            English. We follow a concept-first teaching methodology so that students retain
            knowledge and apply it effectively in exams.
          </p>
          <p className="font-medium text-primary-dark">
            Our mission is to make quality education accessible and effective for every learner.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-6">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-3xl">📐</span>
            <div>
              <span className="font-semibold text-primary-dark">Mathematics</span>
              <p className="text-sm text-slate-600">Concepts, shortcuts & exam strategies</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-3xl">📝</span>
            <div>
              <span className="font-semibold text-primary-dark">English</span>
              <p className="text-sm text-slate-600">Grammar, comprehension & communication</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
