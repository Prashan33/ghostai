import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentIdentity } from '@/lib/project-access'

export interface CollaboratorProfile {
  email: string
  name: string | null
  avatarUrl: string | null
}

async function enrichWithClerk(emails: string[]): Promise<CollaboratorProfile[]> {
  if (emails.length === 0) return []
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({ emailAddress: emails })
  const byEmail = new Map(
    users.map((u) => [
      u.primaryEmailAddress?.emailAddress ?? '',
      {
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
        avatarUrl: u.imageUrl || null,
      },
    ]),
  )
  return emails.map((email) => ({
    email,
    ...(byEmail.get(email) ?? { name: null, avatarUrl: null }),
  }))
}

async function getOwnerProfile(ownerId: string): Promise<CollaboratorProfile> {
  const client = await clerkClient()
  const user = await client.users.getUser(ownerId)
  return {
    email: user.primaryEmailAddress?.emailAddress ?? '',
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
    avatarUrl: user.imageUrl || null,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  const { userId, email } = identity

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const isOwner = project.ownerId === userId
  if (!isOwner) {
    if (!email) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const collab = await prisma.projectCollaborator.findFirst({
      where: { projectId, email: email.toLowerCase() },
    })
    if (!collab) return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: { email: true },
  })

  const [owner, collaborators] = await Promise.all([
    getOwnerProfile(project.ownerId),
    enrichWithClerk(rows.map((r) => r.email)),
  ])

  return Response.json({ owner, collaborators })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body: unknown = await request.json().catch(() => ({}))
  const rawEmail =
    body && typeof body === 'object' && 'email' in body
      ? (body as { email: unknown }).email
      : undefined
  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return Response.json({ error: 'email is required' }, { status: 400 })
  }

  const email = rawEmail.trim().toLowerCase()

  const identity = await getCurrentIdentity()
  if (identity?.email?.toLowerCase() === email) {
    return Response.json({ error: 'Cannot add yourself as a collaborator' }, { status: 400 })
  }

  const existing = await prisma.projectCollaborator.findFirst({ where: { projectId, email } })
  if (existing) return Response.json({ error: 'Already a collaborator' }, { status: 409 })

  const created = await prisma.projectCollaborator.create({ data: { projectId, email } })

  return Response.json({ email: created.email }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body: unknown = await request.json().catch(() => ({}))
  const rawEmail =
    body && typeof body === 'object' && 'email' in body
      ? (body as { email: unknown }).email
      : undefined
  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return Response.json({ error: 'email is required' }, { status: 400 })
  }

  const email = rawEmail.trim().toLowerCase()

  await prisma.projectCollaborator.deleteMany({ where: { projectId, email } })

  return new Response(null, { status: 204 })
}
