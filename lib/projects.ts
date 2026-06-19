import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export interface ProjectData {
  id: string
  name: string
}

export async function getOwnedProjects(): Promise<ProjectData[]> {
  const { userId } = await auth()
  if (!userId) return []
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  })
}

export async function getSharedProjects(): Promise<ProjectData[]> {
  const { userId } = await auth()
  if (!userId) return []

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.primaryEmailAddress?.emailAddress
  if (!email) return []

  const collaborations = await prisma.projectCollaborator.findMany({
    where: { email },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collaborations.map((c) => c.project)
}
