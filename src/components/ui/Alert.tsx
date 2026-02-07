"use client"

import React from "react"
import { cn } from "@/lib/utils"

type AlertVariant = "info" | "success" | "warning" | "error"

type Props = {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: string; text: string }> = {
  info: {
    bg: "bg-blue-900/20",
    border: "border-blue-600",
    icon: "ℹ️",
    text: "text-blue-300"
  },
  success: {
    bg: "bg-green-900/20",
    border: "border-green-600",
    icon: "✅",
    text: "text-green-300"
  },
  warning: {
    bg: "bg-yellow-900/20",
    border: "border-yellow-600",
    icon: "⚠️",
    text: "text-yellow-300"
  },
  error: {
    bg: "bg-red-900/20",
    border: "border-red-600",
    icon: "❌",
    text: "text-red-300"
  }
}

export function Alert({
  variant = "info",
  title,
  children,
  className,
  dismissible = false,
  onDismiss,
  icon
}: Props) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "rounded-lg border p-4 animate-fade-in",
        styles.bg,
        styles.border,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icon || styles.icon}</span>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("font-semibold mb-1", styles.text)}>{title}</h4>
          )}
          <div className={cn("text-sm", styles.text)}>{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-300 flex-shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// Inline alert for form errors
export function FormAlert({ message, className }: { message: string; className?: string }) {
  return (
    <Alert variant="error" className={className}>
      {message}
    </Alert>
  )
}

// Success message alert
export function SuccessAlert({ 
  title = "Success!", 
  message,
  className 
}: { 
  title?: string
  message: string
  className?: string 
}) {
  return (
    <Alert variant="success" title={title} className={className}>
      {message}
    </Alert>
  )
}

// Warning alert
export function WarningAlert({ 
  title = "Warning", 
  message,
  className 
}: { 
  title?: string
  message: string
  className?: string 
}) {
  return (
    <Alert variant="warning" title={title} className={className}>
      {message}
    </Alert>
  )
}

// Info alert
export function InfoAlert({ 
  title = "Info", 
  message,
  className 
}: { 
  title?: string
  message: string
  className?: string 
}) {
  return (
    <Alert variant="info" title={title} className={className}>
      {message}
    </Alert>
  )
}
