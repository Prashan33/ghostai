import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getProjectAccess } from '@/lib/project-access'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await params

    const { project, hasAccess } = await getProjectAccess(projectId)
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
    if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      select: { id: true, filePath: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ specs })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
