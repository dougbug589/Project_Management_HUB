import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth'

// GET notification preferences for current user
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Find or create default preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id }
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
        }
      })
    }

    return NextResponse.json({ success: true, data: preferences })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// PATCH update notification preferences
export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Extract only allowed preference fields
    const allowedFields = [
      'emailTaskAssigned', 'emailTaskUpdated', 'emailCommentAdded',
      'emailMilestoneAlert', 'emailDeadlineReminder', 'emailIssueReported',
      'emailTimesheetStatus', 'inAppTaskAssigned', 'inAppTaskUpdated',
      'inAppCommentAdded', 'inAppMilestoneAlert', 'inAppDeadlineReminder',
      'inAppIssueReported', 'inAppTimesheetStatus'
    ]
    
    const updateData: Record<string, boolean> = {}
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field]
      }
    }

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
      }
    })

    return NextResponse.json({ success: true, data: preferences })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 })
  }
}
