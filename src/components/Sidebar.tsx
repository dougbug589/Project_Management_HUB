"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bug,
  Target,
  Clock,
  Users,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
  FilePlus2,
  type LucideIcon,
} from "lucide-react"
import { UserPlus } from "./ui/Icons"

type User = {
  name?: string
  email?: string
  role?: string
  avatar?: string
}

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    }
    return null
  })
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem("user")
      setUser(userData ? JSON.parse(userData) : null)
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/organizations", label: "Organizations", icon: Building2 },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/templates", label: "Templates", icon: FilePlus2 },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/issues", label: "Issues", icon: Bug },
    { href: "/milestones", label: "Milestones", icon: Target },
    { href: "/timesheets", label: "Timesheets", icon: Clock },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/users", label: "Users", icon: UserPlus },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: User },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-blue-400">
              ProjectHub
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        {!isCollapsed && user && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm font-medium text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <IconComponent size={20} />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-900/30 transition-all text-red-400 hover:text-red-300"
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
