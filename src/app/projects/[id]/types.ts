export interface Project {
  id: string
  name: string
  description?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  archivedAt?: string | null
  owner?: {
    id: string
    name?: string | null
    email?: string | null
  }
  members?: Array<{
    userId: string
    role: string
  }>
  _count?: {
    tasks?: number
    teams?: number
    comments?: number
  }
}

export interface Phase {
  id: string
  name: string
  description?: string
  sequence: number
  status: string
  startDate?: string
  endDate?: string
}

export interface ActivityLogItem {
  id: string
  action: string
  entity: string
  entityId: string
  changes?: string
  createdAt: string
  user: { id: string; name: string }
}
