import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { prisma } from '@/lib/prisma'
import { getProjectAccess } from '@/lib/project-access'
import type { generateSpecTask } from '@/trigger/generate-spec'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { roomId, chatHistory, nodes, edges } = body as Record<string, unknown>

  if (typeof roomId !== 'string' || !roomId.trim()) {
    return Response.json({ error: 'roomId is required' }, { status: 400 })
  }
  if (!Array.isArray(chatHistory)) {
    return Response.json({ error: 'chatHistory is required' }, { status: 400 })
  }
  if (!Array.isArray(nodes)) {
    return Response.json({ error: 'nodes is required' }, { status: 400 })
  }
  if (!Array.isArray(edges)) {
    return Response.json({ error: 'edges is required' }, { status: 400 })
  }

  // Resolve project from roomId — never trust a client-supplied projectId
  const { project, hasAccess } = await getProjectAccess(roomId.trim())
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const handle = await tasks.trigger<typeof generateSpecTask>('generate-spec', {
    projectId: project.id,
    roomId: roomId.trim(),
    chatHistory,
    nodes,
    edges,
  })

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId,
    },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
