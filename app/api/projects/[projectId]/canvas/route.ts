import { auth } from '@clerk/nextjs/server'
import { head, put } from '@vercel/blob'
import { NextRequest } from 'next/server'
import { getProjectAccess } from '@/lib/project-access'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const { project, hasAccess } = await getProjectAccess(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const blob = await put(`canvas/${projectId}.json`, JSON.stringify(body), {
    access: 'private',
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
  })

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  })

  return Response.json({ url: blob.url })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const { project, hasAccess } = await getProjectAccess(projectId)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const row = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  })

  if (!row?.canvasJsonPath) {
    return Response.json({ error: 'No saved canvas' }, { status: 404 })
  }

  const blobMeta = await head(row.canvasJsonPath)
  const blobRes = await fetch(blobMeta.downloadUrl)
  if (!blobRes.ok) {
    return Response.json({ error: 'Failed to fetch canvas data' }, { status: 502 })
  }

  const canvas: unknown = await blobRes.json()
  return Response.json(canvas)
}
