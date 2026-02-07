"use client"

import React from "react"

type Option = { label: string; value: string }

type Props = {
  label?: string
  values: string[]
  options: Option[]
  placeholder?: string
  onChange: (values: string[]) => void
  disabled?: boolean
}

export function MultiSelect({ label, values, options, placeholder = "Select...", onChange, disabled }: Props) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v))
    else onChange([...values, v])
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <div className="border border-gray-600 rounded-lg p-2 flex flex-wrap gap-2 min-h-[42px] bg-gray-800">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            className={`px-2 py-1 rounded border text-sm ${
              values.includes(opt.value)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-700 text-gray-300 border-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {values.length === 0 && (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </div>
    </div>
  )
}
