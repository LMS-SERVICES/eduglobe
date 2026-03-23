'use client'

import { Toaster } from 'sonner'

/**
 * Single app-wide toast host (light + dark pages). Mounted from Providers.
 */
export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      richColors
      closeButton
      expand
      offset="4.5rem"
      visibleToasts={5}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            '!bg-slate-900/95 !border !border-slate-600/80 !text-slate-100 !shadow-xl !backdrop-blur-md',
          title: '!text-slate-50 !font-semibold',
          description: '!text-slate-300',
          error: '!border-red-500/50',
          success: '!border-emerald-500/50',
          warning: '!border-amber-500/50',
          closeButton: '!bg-slate-800 !text-slate-200 !border-slate-600',
        },
      }}
    />
  )
}
