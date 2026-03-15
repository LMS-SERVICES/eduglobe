"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE, NAV, LMS_PORTAL_URL } from "@/lib/constants";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar – quick links */}
      <div className="bg-primary-light/10 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9 text-sm">
            <nav className="hidden md:flex items-center gap-6 text-primary-dark">
              <Link href="/popular-courses" className="hover:text-primary hover:underline">
                Popular Courses
              </Link>
              <Link href="/academic-course" className="hover:text-primary hover:underline">
                Academic Course
              </Link>
              <Link href="/mock-test" className="hover:text-primary hover:underline">
                Mock Test
              </Link>
              <Link href="/previous-year-papers" className="hover:text-primary hover:underline">
                Previous Questions Papers
              </Link>
              <Link href="/about" className="hover:text-primary hover:underline">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-primary hover:underline">
                Contact Us
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-primary-dark/80 text-xs md:text-sm">
                {SITE.tagline}
              </span>
              <a
                href={LMS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                LMS Portal
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
              <span className="font-bold text-xl">{SITE.name}</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href={LMS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-md bg-accent-orange text-white font-medium hover:bg-orange-600 transition"
              >
                Enroll Now
              </Link>
              <button
                type="button"
                className="lg:hidden p-2 text-white rounded-md hover:bg-white/10"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-primary-dark">
            <nav className="px-4 py-3 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={LMS_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 px-4 py-2 rounded-md bg-accent-orange text-white font-medium text-center"
                onClick={() => setMenuOpen(false)}
              >
                Enroll Now
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
