import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { auth as triggerAuth } from '@trigger.dev/sdk/v3'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { runId } = body as Record<string, unknown>

  if (typeof runId !== 'string' || !runId.trim()) {
    return Response.json({ error: 'runId is required' }, { status: 400 })
  }

  const taskRun = await prisma.taskRun.findUnique({ where: { runId: runId.trim() } })
  if (!taskRun) return Response.json({ error: 'Not found' }, { status: 404 })
  if (taskRun.userId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [runId.trim()],
      },
    },
    expirationTime: '1h',
  })

  return Response.json({ token })
}
