"use client"

import React from "react"

type Props = { size?: number; className?: string }

export function Loader({ size = 20, className = "" }: Props) {
  const s = `${size}px`
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-gray-700 align-[-0.125em] ${className}`}
      style={{ width: s, height: s }}
      aria-label="Loading"
      role="status"
    />
  )
}
