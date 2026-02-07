"use client"

import React, { useEffect } from "react"

export type ToastItem = {
  id: string
  title?: string
  message: string
  type?: "success" | "error" | "info" | "warning"
  durationMs?: number
}

type Props = {
  queue: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ queue, onDismiss }: Props) {
  useEffect(() => {
    const timers = queue.map((item) => {
      const ms = item.durationMs ?? 3000
      return setTimeout(() => onDismiss(item.id), ms)
    })
    return () => timers.forEach(clearTimeout)
  }, [queue, onDismiss])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {queue.map((t) => (
        <div
          key={t.id}
          className={`min-w-[240px] rounded-md border px-4 py-3 shadow-sm text-sm bg-gray-900 ${
            t.type === "success"
              ? "border-green-600"
              : t.type === "error"
              ? "border-red-600"
              : t.type === "warning"
              ? "border-yellow-600"
              : "border-gray-700"
          }`}
        >
          {t.title && <div className="font-medium mb-0.5 text-white">{t.title}</div>}
          <div className="text-gray-300">{t.message}</div>
          <button className="text-xs text-gray-400 mt-1 hover:text-gray-300 hover:underline" onClick={() => onDismiss(t.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
