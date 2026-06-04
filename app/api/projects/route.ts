import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()
  const emailAddresses = user?.emailAddresses.map((e) => e.emailAddress) || []

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { email: { in: emailAddresses } } } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Malformed JSON payload' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return Response.json({ error: 'Payload must be an object' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>

  if ('name' in payload && typeof payload.name !== 'string') {
    return Response.json({ error: 'Project name must be a string' }, { status: 400 })
  }

  if ('description' in payload && payload.description !== null && typeof payload.description !== 'string') {
    return Response.json({ error: 'Description must be a string' }, { status: 400 })
  }

  if ('id' in payload && typeof payload.id !== 'string') {
    return Response.json({ error: 'Project ID must be a string' }, { status: 400 })
  }

  const projectName = typeof payload.name === 'string' ? payload.name.trim() : 'Untitled Project'
  const projectDescription = typeof payload.description === 'string' ? payload.description.trim() : null

  try {

    const project = await prisma.project.create({
      data: {
        id: typeof payload.id === 'string' ? payload.id.trim() : undefined,
        ownerId: userId,
        name: projectName,
        description: projectDescription,
        status: 'DRAFT',
      }
    })
    return Response.json(project, { status: 201 })
  } catch (error) {
    console.error('Failed to create project:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
