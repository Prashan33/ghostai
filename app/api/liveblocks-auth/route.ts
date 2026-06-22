import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getProjectAccess } from '@/lib/project-access'
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

  // room is the project ID used as the Liveblocks room ID
  const { project, hasAccess } = await getProjectAccess(room)
  if (!project || !hasAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
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
