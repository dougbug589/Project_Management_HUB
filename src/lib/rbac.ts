import prisma from "./prisma"
import { ApiError } from "./errors"

// Type definitions for string-based enums
export type UserRole = "SUPER_ADMIN" | "PROJECT_ADMIN" | "PROJECT_MANAGER" | "TEAM_LEAD" | "TEAM_MEMBER" | "CLIENT"
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED"

export type OrgMembershipResult = {
  organizationId: string
  role: UserRole
}

export async function getOrCreateDefaultOrganization(
  userId: string
): Promise<OrgMembershipResult> {
  const existing = await prisma.organizationMember.findFirst({
    where: { userId, status: "ACCEPTED" },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  })

  if (existing) {
    return {
      organizationId: existing.organizationId,
      role: existing.role as UserRole,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true },
  })

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const orgName = user.name
    ? `${user.name}'s Organization`
    : `Org ${user.email || userId}`

  // CLIENT users should never auto-create organizations
  const userRole = user.role || "TEAM_MEMBER"
  if (userRole === "CLIENT") {
    throw new ApiError(403, "CLIENT users cannot create organizations. Please contact your administrator.")
  }

  const membership = await prisma.organizationMember.create({
    data: {
      role: "SUPER_ADMIN",
      status: "ACCEPTED",
      user: {
        connect: { id: userId },
      },
      organization: {
        create: {
          name: orgName,
          ownerId: userId,
        },
      },
    },
    include: { organization: true },
  })

  return {
    organizationId: membership.organizationId,
    role: membership.role as UserRole,
  }
}

export async function ensureOrgRole(
  userId: string,
  organizationId: string,
  allowed?: UserRole[]
): Promise<UserRole> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { role: true, status: true },
  })

  if (!membership || membership.status !== "ACCEPTED") {
    throw new ApiError(403, "Unauthorized")
  }

  const role = membership.role as UserRole
  if (allowed && !allowed.includes(role)) {
    throw new ApiError(403, "Forbidden")
  }

  return role
}

export async function ensureProjectAccess(
  userId: string,
  projectId: string
): Promise<{ role: UserRole; organizationId: string; ownerId: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      organizationId: true,
      members: {
        where: { userId, status: "ACCEPTED" },
        select: { role: true },
      },
    },
  })

  if (!project) {
    throw new ApiError(404, "Project not found")
  }

  if (project.ownerId === userId) {
    return { role: "PROJECT_ADMIN" as UserRole, organizationId: project.organizationId, ownerId: project.ownerId }
  }

  const membership = project.members[0]

  if (!membership) {
    throw new ApiError(403, "Unauthorized")
  }

  return {
    role: membership.role as UserRole,
    organizationId: project.organizationId,
    ownerId: project.ownerId,
  }
}

export async function ensureProjectRole(
  userId: string,
  projectId: string,
  allowed: UserRole[]
): Promise<{ organizationId: string; ownerId: string; role: UserRole }> {
  const access = await ensureProjectAccess(userId, projectId)
  if (!allowed.includes(access.role)) {
    throw new ApiError(403, "Forbidden")
  }
  return access
}
