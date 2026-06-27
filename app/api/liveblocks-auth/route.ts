import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { liveblocks, getCursorColor } from '@/lib/liveblocks'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const room =
    body && typeof body === 'object' && 'room' in body
      ? (body as { room: unknown }).room
      : undefined

  if (typeof room !== 'string' || !room) {
    return Response.json({ error: 'room is required' }, { status: 400 })
  }

  // Fetch Clerk user and project record in parallel (was two sequential Clerk calls before)
  const client = await clerkClient()
  const [user, project] = await Promise.all([
    client.users.getUser(userId),
    prisma.project.findUnique({
      where: { id: room },
      select: { id: true, ownerId: true },
    }),
  ])

  if (!project) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Check access: owner fast-path, then collaborator lookup
  let hasAccess = project.ownerId === userId
  if (!hasAccess) {
    const email = user.primaryEmailAddress?.emailAddress
    if (email) {
      const collaborator = await prisma.projectCollaborator.findFirst({
        where: { projectId: room, email: email.toLowerCase() },
      })
      hasAccess = !!collaborator
    }
  }

  if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? userId
  const avatar = user.imageUrl
  const color = getCursorColor(userId)

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name, avatar, color },
  })
  session.allow(room, session.FULL_ACCESS)

  const { status, body: responseBody } = await session.authorize()
  return new Response(responseBody, { status })
}
