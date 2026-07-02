import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { prisma } from '@/lib/prisma'
import { getProjectAccess } from '@/lib/project-access'
import type { designAgentTask } from '@/trigger/design-agent'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { prompt, roomId, projectId } = body as Record<string, unknown>

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (typeof roomId !== 'string' || !roomId.trim()) {
    return Response.json({ error: 'roomId is required' }, { status: 400 })
  }
  if (typeof projectId !== 'string' || !projectId.trim()) {
    return Response.json({ error: 'projectId is required' }, { status: 400 })
  }

  const { project, hasAccess } = await getProjectAccess(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const handle = await tasks.trigger<typeof designAgentTask>('design-agent', {
    prompt: prompt.trim(),
    roomId: roomId.trim(),
  })

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId,
    },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
