import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth'

// GET client dashboard (read-only projects for CLIENT users)
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details to verify CLIENT role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get projects where the user is a member (for CLIENT role, they'll have read-only access)
    const projectMemberships = await prisma.projectMember.findMany({
      where: { 
        userId: user.id,
        status: 'ACCEPTED'
      },
      include: {
        project: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true
              },
              take: 10,
              orderBy: { createdAt: 'desc' }
            },
            milestones: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true
              },
              orderBy: { dueDate: 'asc' }
            },
            reportExports: {
              select: {
                id: true,
                type: true,
                format: true,
                status: true,
                fileUrl: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                tasks: true,
                milestones: true,
                issues: true
              }
            }
          }
        }
      }
    })

    // Transform data for client view
    const projects = projectMemberships.map(membership => {
      const project = membership.project
      const totalTasks = project._count.tasks
      const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        progress,
        manager: {
          name: project.owner.name,
          email: project.owner.email
        },
        tasks: project.tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority
        })),
        milestones: project.milestones.map(m => ({
          id: m.id,
          title: m.title,
          status: m.status,
          dueDate: m.dueDate
        })),
        reports: project.reportExports.map(r => ({
          id: r.id,
          type: r.type,
          format: r.format,
          status: r.status,
          fileUrl: r.fileUrl,
          createdAt: r.createdAt,
        })),
        counts: project._count
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        clientName: dbUser.name,
        clientEmail: dbUser.email,
        projects
      }
    })
  } catch (error) {
    console.error('Client dashboard error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch client dashboard' }, { status: 500 })
  }
}
