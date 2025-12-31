"use client"

import { useEffect } from "react"
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), 4000)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts])

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id}>
          {t.title && <ToastTitle>{t.title}</ToastTitle>}
          {t.description && (
            <ToastDescription>{t.description}</ToastDescription>
          )}
        </Toast>
      ))}

      <ToastViewport />
    </ToastProvider>
  )
}
