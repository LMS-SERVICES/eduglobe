/**
 * Central Sonner usage: concise title + optional description, stable durations.
 * Import `toast` for advanced cases (ids, promise, loading, dismiss).
 */
import { toast as sonnerToast } from 'sonner'

const duration = {
  success: 4500,
  error: 8000,
  warning: 6500,
  info: 5000,
} as const

function desc(d?: string | null) {
  const t = d?.trim()
  return t ? t : undefined
}

export function toastSuccess(title: string, description?: string | null) {
  return sonnerToast.success(title, {
    description: desc(description),
    duration: duration.success,
  })
}

export function toastError(title: string, description?: string | null) {
  return sonnerToast.error(title, {
    description: desc(description),
    duration: duration.error,
  })
}

export function toastWarning(title: string, description?: string | null) {
  return sonnerToast.warning(title, {
    description: desc(description),
    duration: duration.warning,
  })
}

export function toastInfo(title: string, description?: string | null) {
  return sonnerToast.info(title, {
    description: desc(description),
    duration: duration.info,
  })
}

/** Full Sonner API — use for `toast.promise`, `toast.dismiss(id)`, wizard `id`, etc. */
export const toast = sonnerToast
