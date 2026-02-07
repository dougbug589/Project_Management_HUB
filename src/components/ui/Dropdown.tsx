"use client"

import React from "react"

type Option = { label: string; value: string }

type Props = {
  label?: string
  value?: string
  options: Option[]
  placeholder?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function Dropdown({ label, value, options, placeholder = "Select...", onChange, disabled }: Props) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <select
        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 bg-gray-800 text-white"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
