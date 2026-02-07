"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "gradient"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

export function Button({
  children,
  className,
  disabled,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  ...props
}: ButtonProps) {
  const baseStyles = "font-semibold rounded-lg transition-colors duration-200 relative overflow-hidden disabled:cursor-not-allowed disabled:opacity-50"
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3.5 text-lg",
  }
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500",
    secondary: "bg-gray-700 text-gray-100 hover:bg-gray-600 disabled:bg-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-500",
    ghost: "bg-transparent text-gray-300 hover:bg-gray-800 disabled:text-gray-400 disabled:hover:bg-transparent",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-500",
    gradient: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500",
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
