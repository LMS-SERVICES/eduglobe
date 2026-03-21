'use client'

import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  email: string
  name: string | null
  mobileNumber: string | null
  role: string
  createdAt: string
  _count: { enrollments: number }
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.ok ? res.json() : [])
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter((u) =>
    (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoleChange = async (id: string, nextRole: 'USER' | 'ADMIN') => {
    setActionError('')
    setUpdatingUserId(id)
    const prevUsers = users
    setUsers((current) => current.map((u) => (u.id === id ? { ...u, role: nextRole } : u)))

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })

      const data = await response.json()
      if (!response.ok) {
        setUsers(prevUsers)
        setActionError(data.error || 'Failed to update role')
      }
    } catch {
      setUsers(prevUsers)
      setActionError('Failed to update role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users Management</h1>
        <p className="mt-2 text-gray-400">View and manage all users</p>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {actionError}
        </div>
      )}

      <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700">
            <thead className="bg-dark-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Enrollments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{user.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.mobileNumber || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        disabled={updatingUserId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                        className={`text-xs px-2 py-1 rounded-full border font-semibold bg-dark-900 text-white border-dark-600 hover:border-primary-500 transition-colors ${
                          user.role === 'ADMIN' ? 'text-purple-400 border-purple-500/30' : 'text-blue-400 border-blue-500/30'
                        }`}
                      >
                        <option value="USER" className="bg-dark-800">USER</option>
                        <option value="ADMIN" className="bg-dark-800">ADMIN</option>
                      </select>
                      {session?.user?.id === user.id && (
                        <p className="text-[10px] text-gray-500 mt-1">Your account</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user._count.enrollments}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Admins</p>
            <p className="text-2xl font-bold text-purple-400">{users.filter((u) => u.role === 'ADMIN').length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Regular Users</p>
            <p className="text-2xl font-bold text-blue-400">{users.filter((u) => u.role === 'USER').length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
