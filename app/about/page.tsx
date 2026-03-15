import { AboutAcademy } from "@/components/AboutAcademy";

export const metadata = {
  title: "About Us – EduGlobe Academy",
  description: "Learn about EduGlobe Academy – concept-based learning for TET, DSC, and competitive exams.",
};

export default function AboutPage() {
  return (
    <div className="py-8">
      <AboutAcademy />
    </div>
  );
}
