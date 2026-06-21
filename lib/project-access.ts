import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export interface ProjectIdentity {
  userId: string
  email: string | null
}

export async function getCurrentIdentity(): Promise<ProjectIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.primaryEmailAddress?.emailAddress ?? null

  return { userId, email }
}

export async function getProjectAccess(projectId: string): Promise<{
  project: { id: string; name: string; ownerId: string } | null
  hasAccess: boolean
}> {
  const identity = await getCurrentIdentity()
  if (!identity) return { project: null, hasAccess: false }

  const { userId, email } = identity

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) return { project: null, hasAccess: false }

  if (project.ownerId === userId) return { project, hasAccess: true }

  if (!email) return { project, hasAccess: false }

  const collaborator = await prisma.projectCollaborator.findFirst({
    where: { projectId, email: email.toLowerCase() },
  })

  return { project, hasAccess: !!collaborator }
}
