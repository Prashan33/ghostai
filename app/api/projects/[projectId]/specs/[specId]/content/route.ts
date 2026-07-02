import { auth } from '@clerk/nextjs/server'
import { head } from '@vercel/blob'
import { NextRequest } from 'next/server'
import { getProjectAccess } from '@/lib/project-access'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, specId } = await params

    const { project, hasAccess } = await getProjectAccess(projectId)
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
    if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      select: { id: true, projectId: true, filePath: true },
    })

    if (!spec || spec.projectId !== projectId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const blobMeta = await head(spec.filePath)
    const blobRes = await fetch(blobMeta.downloadUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })
    if (!blobRes.ok) {
      return Response.json({ error: 'Failed to fetch spec' }, { status: 502 })
    }

    const content = await blobRes.text()

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
