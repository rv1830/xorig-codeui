import * as React from "react"

type Toast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  function toast(toast: Omit<Toast, "id">) {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, ...toast }])
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toast, dismiss, toasts }
}
