"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Project Card Component
type ProjectCardProps = {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  taskCount?: number
  teamCount?: number
  progress?: number
  className?: string
  onClick?: () => void
}

export function ProjectCard({
  id,
  name,
  description,
  status,
  startDate,
  taskCount = 0,
  teamCount = 0,
  progress = 0,
  className,
  onClick
}: ProjectCardProps) {
  const statusColors: Record<string, string> = {
    PLANNING: "bg-blue-600",
    IN_PROGRESS: "bg-yellow-600",
    COMPLETED: "bg-green-600",
    ON_HOLD: "bg-orange-600",
    CANCELLED: "bg-red-600"
  }

  const content = (
    <div
      className={cn(
        "bg-gray-800/80 border border-gray-700 rounded-xl p-6 cursor-pointer",
        "hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10",
        "transition-all duration-300 group animate-slide-up",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
          📁 {name}
        </h3>
        <span
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-full text-white",
            statusColors[status] || "bg-gray-600"
          )}
        >
          {status.replace("_", " ")}
        </span>
      </div>

      {description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>
      )}

      {progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        {startDate && (
          <span className="flex items-center gap-1">
            📅 {new Date(startDate).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">✅ {taskCount} tasks</span>
        <span className="flex items-center gap-1">👥 {teamCount} teams</span>
      </div>
    </div>
  )

  if (onClick) {
    return content
  }

  return <Link href={`/projects/${id}`}>{content}</Link>
}

// Task Card Component
type TaskCardProps = {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  projectName?: string
  assignees?: Array<{ id: string; name: string }>
  className?: string
  onClick?: () => void
}

export function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  projectName,
  assignees = [],
  className,
  onClick
}: TaskCardProps) {
  const statusColors: Record<string, string> = {
    TODO: "bg-gray-600",
    IN_PROGRESS: "bg-blue-600",
    IN_REVIEW: "bg-purple-600",
    DONE: "bg-green-600",
    BLOCKED: "bg-red-600"
  }

  const priorityColors: Record<string, string> = {
    LOW: "text-green-400",
    MEDIUM: "text-yellow-400",
    HIGH: "text-orange-400",
    URGENT: "text-red-400"
  }

  const priorityIcons: Record<string, string> = {
    LOW: "🟢",
    MEDIUM: "🟡",
    HIGH: "🟠",
    URGENT: "🔴"
  }

  const isOverdue = dueDate && status !== "DONE" && new Date(dueDate) < new Date()

  const content = (
    <div
      className={cn(
        "bg-gray-800/80 border border-gray-700 rounded-xl p-5 cursor-pointer",
        "hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10",
        "transition-all duration-300 group animate-slide-up",
        isOverdue && "border-red-500/50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
          ✅ {title}
        </h3>
        <span
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-full text-white",
            statusColors[status] || "bg-gray-600"
          )}
        >
          {status.replace("_", " ")}
        </span>
      </div>

      {description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className={cn("flex items-center gap-1", priorityColors[priority])}>
          {priorityIcons[priority]} {priority}
        </span>

        {dueDate && (
          <span className={cn("flex items-center gap-1", isOverdue ? "text-red-400" : "text-gray-500")}>
            📅 {new Date(dueDate).toLocaleDateString()}
            {isOverdue && " (Overdue)"}
          </span>
        )}

        {projectName && (
          <span className="text-gray-500">📁 {projectName}</span>
        )}
      </div>

      {assignees.length > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {assignees.slice(0, 3).map((assignee) => (
            <span
              key={assignee.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white font-medium"
              title={assignee.name}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </span>
          ))}
          {assignees.length > 3 && (
            <span className="text-xs text-gray-500">+{assignees.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )

  if (onClick) {
    return content
  }

  return <Link href={`/tasks/${id}`}>{content}</Link>
}

// User Card Component
type UserCardProps = {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  status?: "ONLINE" | "AWAY" | "OFFLINE"
  taskCount?: number
  className?: string
  onClick?: () => void
}

export function UserCard({
  name,
  email,
  role,
  status,
  taskCount,
  className,
  onClick
}: UserCardProps) {
  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "text-purple-400",
    PROJECT_ADMIN: "text-blue-400",
    PROJECT_MANAGER: "text-green-400",
    TEAM_LEAD: "text-yellow-400",
    TEAM_MEMBER: "text-gray-400",
    CLIENT: "text-orange-400"
  }

  const statusColors: Record<string, string> = {
    ONLINE: "bg-green-500",
    AWAY: "bg-yellow-500",
    OFFLINE: "bg-gray-500"
  }

  return (
    <div
      className={cn(
        "bg-gray-800/80 border border-gray-700 rounded-xl p-5 cursor-pointer",
        "hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10",
        "transition-all duration-300 group animate-slide-up",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg text-white font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          {status && (
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800",
                statusColors[status]
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors truncate">
            👤 {name}
          </h3>
          <p className="text-sm text-gray-400 truncate">{email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs font-medium", roleColors[role] || "text-gray-400")}>
              {role.replace("_", " ")}
            </span>
            {taskCount !== undefined && (
              <span className="text-xs text-gray-500">• {taskCount} tasks</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
