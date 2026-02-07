import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth'

// GET discussions for project
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    const discussions = await prisma.discussion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });
    return NextResponse.json({ success: true, data: discussions });
  } catch (error) {
    console.error('Get discussions error:', error);
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
  }
}

// POST create a new discussion message
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    console.log('POST discussion - user:', user);
    
    if (!user) {
      console.log('POST discussion - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    console.log('POST discussion - body:', body);
    
    const { projectId, content } = body
    if (!projectId || !content) {
      console.log('POST discussion - missing projectId or content');
      return NextResponse.json({ error: 'projectId and content required' }, { status: 400 })
    }
    
    const discussion = await prisma.discussion.create({
      data: {
        projectId,
        authorId: user.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } }
      }
    })
    
    console.log('POST discussion - created:', discussion);
    return NextResponse.json({ success: true, data: discussion }, { status: 201 })
  } catch (error) {
    console.error('Create discussion error:', error);
    return NextResponse.json({ 
      error: 'Failed to create discussion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await req.json()
    const { id, content } = body
    
    if (!id || !content) {
      return NextResponse.json({ error: 'id and content required' }, { status: 400 })
    }

    const existingDiscussion = await prisma.discussion.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existingDiscussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (existingDiscussion.authorId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own discussions' }, { status: 403 })
    }

    const discussion = await prisma.discussion.update({
      where: { id },
      data: { content },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } }
      }
    })

    return NextResponse.json({ success: true, data: discussion })
  } catch (error) {
    console.error('Update discussion error:', error);
    return NextResponse.json({ 
      error: 'Failed to update discussion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const existingDiscussion = await prisma.discussion.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existingDiscussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (existingDiscussion.authorId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own discussions' }, { status: 403 })
    }

    await prisma.discussion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Discussion deleted successfully' })
  } catch (error) {
    console.error('Delete discussion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete discussion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
