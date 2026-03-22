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

## Deploy on Render

Render often runs installs with **`NODE_ENV=production`**, which skips **devDependencies** unless you override it. Without TypeScript / Tailwind / ESLint, `next build` fails early (sometimes right after “Creating an optimized production build…”).

**Do this:**

1. **Build command** (Dashboard → your Web Service → Settings → Build):

   ```bash
   npm ci --include=dev && npm run build
   ```

   Or use the included **`render.yaml`** blueprint (New → Blueprint → connect repo).

2. **Start command:** `npm run start`

3. **Environment variables** (set for **Build** and **Runtime** where needed):

   - `DATABASE_URL` — PostgreSQL connection string  
   - `NEXTAUTH_SECRET` — e.g. `openssl rand -base64 32`  
   - `NEXTAUTH_URL` — your public URL, e.g. `https://eduglobe-academy.onrender.com`  
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` if you use payments  
   - Optional: `NODE_OPTIONS=--max-old-space-size=4096` if the build runs out of memory (free tier may still be tight; upgrade build resources if needed).

4. **Node:** Use **Node 20** (see `engines` in `package.json` and `NODE_VERSION` in `render.yaml`).

5. After first deploy, apply schema to your DB (from your machine with production `DATABASE_URL`, or a Render shell):

   ```bash
   npx prisma db push
   ```

`postinstall` runs **`prisma generate`** automatically; `prisma` is a **dependency** so the CLI is available even on production-style installs.

## Docker (production image)

Same pattern as **LMS-USER-PORTAL**: multi-stage build, Next.js **standalone** output, Prisma generate in build.

1. Ensure `.env` exists with at least `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (use `http://localhost:3000` for local Docker), and Razorpay keys if needed.
2. Run:

```bash
make help              # list all targets
make compose-up        # recommended: compose build + run on :3000
# or
make build && make run
```

Stop stack: `make compose-down` or `make stop`.

Apply DB schema to your database (from host, against the same `DATABASE_URL`):

```bash
npx prisma db push
# or
npx prisma migrate deploy
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
