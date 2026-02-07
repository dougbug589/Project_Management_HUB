"use client"

import { useState, useEffect, useRef } from "react"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { Sidebar } from "@/components/Sidebar"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BellOff, User } from "lucide-react"
import Link from "next/link"

type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch("/api/notifications?unread=false", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.slice(0, 10))
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/notifications?id=${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      for (const n of notifications.filter((n) => !n.read)) {
        await fetch(`/api/notifications?id=${n.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setIsOpen(false)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <BellOff className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                    !notification.read ? "bg-gray-750" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        notification.read ? "bg-gray-600" : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-700 bg-gray-900">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push("/dashboard?tab=notifications")
                }}
                className="w-full text-center text-sm text-blue-400 hover:text-blue-300"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<{ name?: string; avatar?: string } | null>(() => {
    // Initialize from localStorage synchronously
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    }
    return null
  })

  useEffect(() => {
    // Re-sync if user data changes externally
    const handleStorageChange = () => {
      const userData = localStorage.getItem("user")
      setUser(userData ? JSON.parse(userData) : null)
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])
  
  // Don't show sidebar on auth pages and client pages
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/"
  const isClientPage = pathname.startsWith("/client") || pathname === "/client-login" || pathname === "/client-dashboard"

  if (isAuthPage || isClientPage) {
    return (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-64 transition-all duration-300 flex flex-col">
          {/* Top header bar with notifications */}
          <header className="sticky top-0 z-40 h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 flex items-center justify-end gap-4">
            <NotificationBell />
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors group"
              title="Edit Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold group-hover:ring-2 group-hover:ring-cyan-500 transition-all">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors hidden sm:block">
                {user?.name || "Profile"}
              </span>
            </Link>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default AppLayout
