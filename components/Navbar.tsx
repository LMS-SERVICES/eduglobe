'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  User,
  Menu,
  X,
  LogOut,
  BookOpen,
  Home,
  ChevronDown,
} from 'lucide-react'
import { SITE } from '@/lib/constants'

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => {})
  }, [pathname])

  // Don't render the public navbar on admin pages
  if (pathname?.startsWith('/admin')) return null

  const handleLogout = async () => {
    await signOut({ redirect: false })
    setIsUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const resourceLinks = [
    { href: '/academic-course', label: 'Academic Course' },
    { href: '/mock-test', label: 'Mock Test' },
    { href: '/previous-year-papers', label: 'Previous Year Papers' },
    { href: '/notification-syllabus', label: 'Notification & Syllabus' },
    { href: '/news-updates', label: 'News Updates' },
  ]

  return (
    <nav className="bg-primary border-b border-primary-light/40 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                <Image src="/eduglobe-logo.png" alt="EduGlobe" fill className="object-contain" sizes="40px" priority />
              </div>
              <span className="font-bold text-lg text-white hidden sm:block">{SITE.name}</span>
            </Link>
            <Link href="/" className="flex items-center justify-center w-9 h-9 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors" title="Home">
              <Home className="w-5 h-5" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {/* Courses Dropdown */}
            <div className="relative" onMouseEnter={() => setIsCoursesOpen(true)} onMouseLeave={() => setIsCoursesOpen(false)}>
              <Link href="/courses" className="flex items-center space-x-1 px-3 py-2 text-white/85 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/10">
                <span>Courses</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} />
              </Link>
              <div className={`absolute top-full left-0 w-64 bg-primary-dark rounded-lg shadow-xl border border-primary-light/40 py-2 transition-all duration-200 origin-top-left ${isCoursesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                <Link href="/courses" className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors font-medium border-b border-primary-light/30 mb-1">
                  Browse All Courses
                </Link>
                <div className="max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/courses?category=${cat.slug}`} className="block px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/quizzes" className="px-3 py-2 text-white/85 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/10">
              Quizzes
            </Link>

            <Link href="/popular-courses" className="px-3 py-2 text-white/85 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/10">
              Popular Courses
            </Link>

            {/* Resources Dropdown */}
            <div className="relative" onMouseEnter={() => setIsResourcesOpen(true)} onMouseLeave={() => setIsResourcesOpen(false)}>
              <button className="flex items-center space-x-1 px-3 py-2 text-white/85 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/10">
                <span>Resources</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`absolute top-full left-0 w-60 bg-primary-dark rounded-lg shadow-xl border border-primary-light/40 py-2 transition-all duration-200 origin-top-left ${isResourcesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                {resourceLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/about" className="px-3 py-2 text-white/85 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/10">
              About
            </Link>

            <Link href="/contact" className="px-3 py-2 text-white/85 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/10">
              Contact
            </Link>
          </div>

          {/* Right Side - Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            {status === 'authenticated' ? (
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 text-white/85 hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold shadow-md shadow-primary-500/50">
                    {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium text-white text-sm">{session?.user?.name || session?.user?.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-primary-dark rounded-lg shadow-xl border border-primary-light/40 py-2 z-50">
                    <div className="px-4 py-2 border-b border-primary-light/30">
                      <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
                      <p className="text-xs text-white/70 truncate">{session?.user?.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors">
                      <User className="w-4 h-4" /><span>My Profile</span>
                    </Link>
                    {session?.user?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors">
                        <BookOpen className="w-4 h-4" /><span>Admin Panel</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-red-300 transition-colors">
                      <LogOut className="w-4 h-4" /><span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="bg-gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all font-medium text-sm">
                  Log In
                </Link>
                <Link href="/signup" className="bg-gradient-to-r from-accent-orange to-accent-pink text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white/85 hover:text-white transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-primary-light/30 mt-2 pt-3">
            <Link href="/" className="flex items-center space-x-2 px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
              <Home className="w-4 h-4" /><span>Home</span>
            </Link>

            {/* Courses with categories */}
            <div>
              <Link href="/courses" className="block px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                Courses
              </Link>
              <div className="pl-6 border-l border-primary-light/30 ml-4 space-y-0.5">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/courses?category=${cat.slug}`} className="block text-sm text-white/70 hover:text-white py-1 px-2 rounded transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/quizzes" className="block px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
              Quizzes
            </Link>
            <Link href="/popular-courses" className="block px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
              Popular Courses
            </Link>

            {/* Resources Section */}
            <div className="px-3 py-1">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Resources</p>
            </div>
            {resourceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}

            <Link href="/about" className="block px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
              About Us
            </Link>
            <Link href="/contact" className="block px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
              Contact Us
            </Link>

            {/* Auth Section */}
            <div className="border-t border-primary-light/30 pt-3 mt-2">
              {status === 'authenticated' ? (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
                    <p className="text-xs text-white/70 truncate">{session?.user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center space-x-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <User className="w-4 h-4" /><span>My Profile</span>
                  </Link>
                  {session?.user?.role === 'ADMIN' && (
                    <Link href="/admin" className="flex items-center space-x-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <BookOpen className="w-4 h-4" /><span>Admin Panel</span>
                    </Link>
                  )}
                  <button onClick={() => { setIsMenuOpen(false); handleLogout() }} className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-red-300 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" /><span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2 px-3">
                  <Link href="/login" className="flex-1 text-center bg-gradient-primary text-white px-4 py-2 rounded-lg font-medium text-sm" onClick={() => setIsMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/signup" className="flex-1 text-center bg-gradient-to-r from-accent-orange to-accent-pink text-white px-4 py-2 rounded-lg font-medium text-sm" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close user menu overlay */}
      {isUserMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />}
    </nav>
  )
}
