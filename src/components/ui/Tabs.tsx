"use client"

import React, { ReactNode } from "react"

type Tab = { id: string; label: string; icon?: ReactNode }

type Props = {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, value, onChange }: Props) {
  return (
    <div className="border-b border-gray-700 mb-3 flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`px-4 py-2 text-sm font-medium rounded-t flex items-center gap-2 transition-colors ${
            t.id === value 
              ? "bg-gray-800 border-x border-t border-gray-700 text-white" 
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
          }`}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}
