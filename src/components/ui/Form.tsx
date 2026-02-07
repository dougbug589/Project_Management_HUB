"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface InputProps {
  label?: string
  error?: string
  className?: string
  icon?: ReactNode
  [key: string]: any
}

export function Input({ label, error, className, icon, ...props }: InputProps) {
  return (
    <div className="w-full animate-slide-up">
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-800 text-white placeholder-gray-400 shadow-sm hover:shadow-md",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 mt-1 animate-fade-in flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full animate-slide-up">
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-vertical bg-gray-800 text-white placeholder-gray-400 shadow-sm hover:shadow-md min-h-[100px]",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400 mt-1 animate-fade-in flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export function Select({ label, error, className, icon, ...props }: InputProps) {
  return (
    <div className="w-full animate-slide-up">
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <select
          className={cn(
            "w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-800 text-white shadow-sm hover:shadow-md cursor-pointer",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 mt-1 animate-fade-in flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export function TimeInput({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full animate-slide-up">
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type="time"
        className={cn(
          "w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-800 text-white placeholder-gray-400 shadow-sm hover:shadow-md",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400 mt-1 animate-fade-in flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

export function DateTimeInput({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full animate-slide-up">
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        className={cn(
          "w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-800 text-white placeholder-gray-400 shadow-sm hover:shadow-md",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400 mt-1 animate-fade-in flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  )
}
