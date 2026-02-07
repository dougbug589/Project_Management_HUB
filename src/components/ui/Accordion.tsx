"use client"

import React, { useState } from "react"

type Item = { id: string; title: string; content: React.ReactNode }

type Props = {
  items: Item[]
  defaultOpenId?: string
}

export function Accordion({ items, defaultOpenId }: Props) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null)
  return (
    <div className="divide-y divide-gray-700 rounded-md border border-gray-700">
      {items.map((it) => {
        const open = openId === it.id
        return (
          <div key={it.id}>
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 text-white"
              onClick={() => setOpenId(open ? null : it.id)}
            >
              <span className="font-medium">{it.title}</span>
              <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▾</span>
            </button>
            {open && <div className="px-4 pb-4 text-sm text-gray-300">{it.content}</div>}
          </div>
        )
      })}
    </div>
  )
}
