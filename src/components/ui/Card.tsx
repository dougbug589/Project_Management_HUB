"use client"

import { ReactNode, CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  gradient?: boolean
  hover?: boolean
  style?: CSSProperties
}

export function Card({ children, className, onClick, gradient = false, hover = false, style }: CardProps) {
  return (
    <div
      className={cn(
        "bg-gray-800 rounded-xl border border-gray-700 p-6",
        hover && "hover:border-blue-500 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("mb-4 pb-4 border-b border-gray-700", className)}>{children}</div>
}

export function CardTitle({ children, className }: CardProps) {
  return <h2 className={cn("text-2xl font-bold text-white", className)}>{children}</h2>
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("text-gray-300", className)}>{children}</div>
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={cn("mt-4 pt-4 border-t border-gray-700", className)}>{children}</div>
}
