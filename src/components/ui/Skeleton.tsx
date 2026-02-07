"use client"

import React from "react"
import { cn } from "@/lib/utils"

type SkeletonProps = {
  className?: string
  variant?: "text" | "circular" | "rectangular" | "card"
  width?: string | number
  height?: string | number
  lines?: number
  animated?: boolean
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
  animated = true
}: SkeletonProps) {
  const baseStyles = cn(
    "bg-gray-700/50 rounded",
    animated && "animate-pulse"
  )

  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl"
  }

  const style: React.CSSProperties = {
    width: width || (variant === "circular" ? height : "100%"),
    height: height || (variant === "text" ? "1rem" : variant === "circular" ? width : "100%")
  }

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variantStyles.text)}
            style={{
              ...style,
              width: i === lines - 1 ? "75%" : style.width
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  )
}

// Card skeleton for loading project/task cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-800/50 rounded-xl border border-gray-700 p-6", className)}>
      <Skeleton variant="text" height="1.5rem" width="60%" className="mb-4" />
      <Skeleton variant="text" lines={2} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height="1.5rem" width="4rem" />
        <Skeleton variant="rectangular" height="1.5rem" width="4rem" />
      </div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height="1rem" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="bg-gray-900 p-4 flex gap-4 border-t border-gray-700">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height="1rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// User avatar skeleton
export function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />
}

// Dashboard widget skeleton
export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-800/50 rounded-xl border border-gray-700 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" height="1rem" width="40%" />
        <AvatarSkeleton size={24} />
      </div>
      <Skeleton variant="text" height="2rem" width="50%" className="mb-2" />
      <Skeleton variant="text" height="0.75rem" width="30%" />
    </div>
  )
}

// List skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <AvatarSkeleton size={32} />
          <div className="flex-1">
            <Skeleton variant="text" height="1rem" width="60%" className="mb-1" />
            <Skeleton variant="text" height="0.75rem" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}
