// Client-side RBAC utilities for UI visibility and permissions

export type UserRole = 
  | "SUPER_ADMIN"
  | "PROJECT_ADMIN" 
  | "PROJECT_MANAGER"
  | "TEAM_LEAD"
  | "TEAM_MEMBER"
  | "CLIENT"
  | "ADMIN" // Legacy support

export function hasOrgRole(userRole: string | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false
  // Handle legacy "ADMIN" role mapping to "SUPER_ADMIN"
  const normalizedRole = userRole === "ADMIN" ? "SUPER_ADMIN" : userRole
  return allowedRoles.includes(normalizedRole as UserRole) || 
         (userRole === "ADMIN" && allowedRoles.includes("ADMIN"))
}

export function hasProjectRole(userRole: string | null | undefined, allowedRoles: UserRole[]): boolean {
  return hasOrgRole(userRole, allowedRoles)
}

export function canManageProject(role: string | null | undefined): boolean {
  return hasOrgRole(role, ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER", "ADMIN"])
}

export function canManageTasks(role: string | null | undefined): boolean {
  return hasOrgRole(role, ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "ADMIN"])
}

export function canManageTeam(role: string | null | undefined): boolean {
  return hasOrgRole(role, ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER", "ADMIN"])
}

export function canViewReports(role: string | null | undefined): boolean {
  return hasOrgRole(role, ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "ADMIN"])
}

export function canApproveTimesheets(role: string | null | undefined): boolean {
  return hasOrgRole(role, ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER", "ADMIN"])
}

export function isClientRole(role: string | null | undefined): boolean {
  return role === "CLIENT"
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "PROJECT_ADMIN" || role === "ADMIN"
}
