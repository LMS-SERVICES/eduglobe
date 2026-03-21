"use client";

import Link from "next/link";
import Image from "next/image";
import { LMS_PORTAL_URL } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col overflow-hidden bg-[#0f1729]">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1729] via-[#1a2744] to-[#0f1729]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,#3b82f620,transparent)]" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,#1e3a5f40,transparent)]" />
      {/* Subtle star-like particles */}
      <div className="absolute inset-0 opacity-60">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white animate-twinkle"
            style={{
              left: `${((i * 7 + 11) % 97) + 1}%`,
              top: `${((i * 13 + 17) % 97) + 1}%`,
              opacity: 0.3 + ((i % 5) / 10),
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-h-[60vh]">
          {/* Left: Branding & CTA */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="flex justify-center lg:justify-start items-center gap-3 mb-4">
              <div className="relative w-12 h-12 rounded-full border-2 border-cyan-400/80 flex items-center justify-center bg-cyan-500/10">
                <Image
                  src="/eduglobe-logo.png"
                  alt="EduGlobe"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="block text-xl font-bold text-white leading-tight">
                  EduGlobe
                </span>
                <span className="block text-sm text-white/90 -mt-0.5">
                  Academy
                </span>
              </div>
            </div>
            <p className="text-white/90 text-sm mb-2">
              #1 Learning Platform for DSC & TET
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Crack{" "}
              <span className="text-[#f0b429]">DSC, TET & CTET Exams</span>
            </h1>
            <p className="mt-2 text-lg text-white/90 flex flex-wrap items-center justify-center lg:justify-start gap-1">
              for AP & TG with Smart Preparation
              <svg
                className="w-5 h-5 text-[#f0b429] inline"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
              </svg>
            </p>
            <p className="mt-4 text-white/80 text-sm max-w-md mx-auto lg:mx-0">
              Complete Courses, Mock Tests & PYQs — All in One Platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href={LMS_PORTAL_URL}
                target={LMS_PORTAL_URL.startsWith("http") ? "_blank" : undefined}
                rel={LMS_PORTAL_URL.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center px-6 py-3.5 rounded-xl bg-[#e85d04] text-white font-semibold hover:bg-[#d95403] transition shadow-lg shadow-orange-500/25"
              >
                Start Learning
              </Link>
              <Link
                href="/popular-courses"
                className="inline-flex items-center px-6 py-3.5 rounded-xl bg-[#152942] text-white font-semibold border-2 border-white/20 hover:bg-white/10 transition"
              >
                View Courses
              </Link>
            </div>
          </div>

          {/* Right: Students image (extracted) */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-[464/430] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
              <Image
                src="/hero-students-only.png"
                alt="Students studying"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 92vw, 420px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats strip with icons */}
      <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-8 justify-items-center">
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center text-[#f0b429]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">1000+</span>
              <span className="text-sm text-white/80">Students</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center text-[#f0b429]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">50+</span>
              <span className="text-sm text-white/80">Courses</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center text-[#f0b429]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">95%</span>
              <span className="text-sm text-white/80">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
