// EduGlobe Academy – contact and config
// Set NEXT_PUBLIC_LMS_PORTAL_URL in .env to point to your LMS user portal

export const SITE = {
  name: "EduGlobe Academy",
  tagline: "Learn More; Grow More",
  heroTagline: "Empowering Students for Academic and Competitive Success",
} as const;

export const CONTACT = {
  mobile: "9849290493",
  mobileDisplay: "+91 98492 90493",
  email: "shekarallapuram68@gmail.com",
  location: "EduGlobe Academy, Hyderabad, India",
} as const;

export const WHATSAPP = {
  number: "919849290493",
  url: "https://wa.me/919849290493",
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/eduglobeacademy",
  twitter: "https://twitter.com/eduglobeacademy",
  instagram: "https://www.instagram.com/eduglobeacademy",
  youtube: "https://www.youtube.com/@eduglobeacademy",
  whatsapp: WHATSAPP.url,
} as const;

export const LMS_PORTAL_URL =
  process.env.NEXT_PUBLIC_LMS_PORTAL_URL || "/lms";

export const NAV = [
  { label: "Popular Courses", href: "/popular-courses" },
  { label: "Academic Course", href: "/academic-course" },
  { label: "Mock Test", href: "/mock-test" },
  { label: "Notification and Syllabus", href: "/notification-syllabus" },
  { label: "Previous Year Questions Papers", href: "/previous-year-papers" },
  { label: "News Updates", href: "/news-updates" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Quizzes", href: "/quizzes" },
  { label: "Achievements / Badges", href: "/achievements" },
] as const;

export const POPULAR_COURSES = [
  {
    id: "tet",
    title: "TET Preparation",
    description: "Structured preparation for Teacher Eligibility Test with concept-based learning and PYQs.",
    href: "/popular-courses?course=tet",
  },
  {
    id: "dsc",
    title: "DSC Preparation",
    description: "Complete guidance for DSC recruitment exams with subject-wise modules and mock tests.",
    href: "/popular-courses?course=dsc",
  },
  {
    id: "math",
    title: "Mathematics Mastery",
    description: "Clear concepts, shortcuts, and exam strategies for Mathematics.",
    href: "/popular-courses?course=mathematics",
  },
  {
    id: "english",
    title: "English Excellence",
    description: "Grammar, comprehension, and communication skills for exams and academics.",
    href: "/popular-courses?course=english",
  },
] as const;
