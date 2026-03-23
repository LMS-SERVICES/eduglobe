'use client'

import { SessionProvider } from 'next-auth/react'
import { AppToaster } from '@/components/AppToaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <AppToaster />
    </SessionProvider>
  )
}
