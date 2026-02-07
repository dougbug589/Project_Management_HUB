"use client"

import React, { useState, useMemo } from "react"
import { Button } from "./Button"

type SortDirection = "asc" | "desc" | null

type Column<T> = { 
  key: keyof T
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
}

type Props<T> = {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  showPagination?: boolean
  showFilters?: boolean
  onRowClick?: (row: T) => void
}

export function Table<T extends { id: string }>({ 
  columns, 
  data, 
  pageSize = 10,
  showPagination = true,
  showFilters = true,
  onRowClick
}: Props<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: SortDirection }>({
    key: null,
    direction: null
  })
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true
        const cellValue = String(row[key as keyof T] || "").toLowerCase()
        return cellValue.includes(value.toLowerCase())
      })
    })
  }, [data, filters])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      
      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === "asc" ? comparison : -comparison
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key 
        ? prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc"
        : "asc"
    }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const getSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) return "⇅"
    if (sortConfig.direction === "asc") return "↑"
    if (sortConfig.direction === "desc") return "↓"
    return "⇅"
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && columns.some(c => c.filterable) && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          {columns.filter(c => c.filterable).map(col => (
            <div key={String(col.key)} className="flex-1 min-w-[150px]">
              <input
                type="text"
                placeholder={`Filter ${col.header}...`}
                value={filters[String(col.key)] || ""}
                onChange={(e) => handleFilterChange(String(col.key), e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((c) => (
                <th 
                  key={String(c.key)} 
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${c.sortable ? 'cursor-pointer hover:bg-gray-700 select-none' : ''}`}
                  onClick={() => c.sortable && handleSort(c.key)}
                >
                  <div className="flex items-center gap-2">
                    {c.header}
                    {c.sortable && (
                      <span className="text-gray-500">{getSortIcon(c.key)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-800 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-4 py-3 text-sm text-gray-300">
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              ««
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <span className="px-3 py-1 text-sm text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              »»
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
