# EduGlobe Academy

**Learn More; Grow More**

Marketing and information site for EduGlobe Academy – TET, DSC, and competitive exam preparation with focus on Mathematics and English.

## Stack

- **Next.js 14** (App Router), **React 18**, **TypeScript**, **Tailwind CSS**

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set NEXT_PUBLIC_LMS_PORTAL_URL to your LMS user portal URL (e.g. https://lms.yoursite.com)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## LMS Portal

- **Enroll Now**, **Explore Courses**, and course/quiz/mock-test links point to the LMS user portal.
- Set `NEXT_PUBLIC_LMS_PORTAL_URL` in `.env` to the full URL of your LMS (e.g. your existing Next.js LMS app). If unset, links use `/lms` (relative).

## Content

- **Contact:** Mobile 9849290493, Email shekarallapuram68@gmail.com, Hyderabad, India.
- **Footer:** WhatsApp link, social icons (Facebook, Twitter, Instagram, YouTube), contact details.
- **Menu:** Popular Courses, Academic Course, Mock Test, Notification and Syllabus, Previous Year Papers, News Updates, About Us, Contact Us, Quizzes, Achievements / Badges.
- **Homepage:** Hero (tagline, Explore Courses, Enroll Now, Achievements/Badges), About Academy, Popular Courses (TET, DSC, Mathematics Mastery, English Excellence).

## Project structure

- `app/` – routes and pages
- `components/` – Navbar, Footer, Hero, AboutAcademy, PopularCourses
- `lib/constants.ts` – site name, contact, nav, courses, LMS URL
