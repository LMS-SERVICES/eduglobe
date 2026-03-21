'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  Menu,
  ChevronRight,
  Tag,
  ArrowLeft,
  ClipboardList,
  Newspaper,
  GraduationCap,
  FileText,
  Archive,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') return null

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/academic-categories', label: 'Academic Categories', icon: Tag },
    { href: '/admin/academic-courses', label: 'Academic Courses', icon: GraduationCap },
    { href: '/admin/syllabus', label: 'Syllabus', icon: FileText },
    { href: '/admin/previous-papers', label: 'Previous Papers', icon: Archive },
    { href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
    { href: '/admin/news-updates', label: 'News Updates', icon: Newspaper },
    { href: '/admin/users', label: 'Users', icon: Users },
  ]

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950"
      style={{ backgroundColor: '#020617' }}
    >
      {sidebarOpen && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-dark-900 text-white z-50 transform transition-all duration-300 ease-in-out border-r border-dark-700 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${sidebarOpen || sidebarCollapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: '#0f172a' }}
      >
        <div className="flex flex-col h-full">
          <div className={`border-b border-dark-700 ${sidebarCollapsed ? 'p-2' : 'p-6'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              <Link href="/admin" className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
                <div className={`relative ${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/10 overflow-hidden`}>
                  <Image src="/eduglobe-logo.png" alt="EduGlobe" fill className="object-contain" priority />
                </div>
                {!sidebarCollapsed && (
                  <span className="font-bold text-lg">EduGlobe Admin</span>
                )}
              </Link>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="text-gray-400 hover:text-white p-1 hover:bg-dark-800 rounded"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
            </div>
          </div>

          {!sidebarCollapsed ? (
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2 border-b border-dark-700 flex justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          )}

          <nav className={`flex-1 space-y-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-3'} ${
                    isActive ? 'bg-dark-800 text-primary-400 border-dark-700' : 'text-gray-300'
                  } rounded-lg hover:bg-dark-800 hover:text-primary-400 transition-colors border ${
                    isActive ? 'border-dark-700' : 'border-transparent'
                  } hover:border-dark-700`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className={`border-t border-dark-700 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <Link
              href="/"
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-3'} text-gray-300 rounded-lg hover:bg-dark-800 hover:text-primary-400 transition-colors mb-2`}
              title={sidebarCollapsed ? 'Back to Site' : ''}
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Back to Site</span>}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-3'} text-gray-300 rounded-lg hover:bg-dark-800 hover:text-red-400 transition-colors`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <header
          className="bg-dark-900/95 border-b border-dark-700 sticky top-0 z-30 backdrop-blur"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => {
                  if (sidebarCollapsed) setSidebarCollapsed(false)
                  setSidebarOpen(true)
                }}
                className="lg:hidden text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-gray-400 hover:text-primary-400 transition-colors"
              >
                <ChevronRight className={`w-5 h-5 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
              </button>
              <div className="flex-1" />
              <Link href="/" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                View Site
              </Link>
            </div>
          </div>
        </header>

        <main
          className="p-4 sm:p-6 lg:p-8 bg-dark-950 min-h-screen text-white"
          style={{ backgroundColor: '#020617' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
