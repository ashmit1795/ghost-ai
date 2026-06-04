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

  let body: any
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Malformed JSON payload' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return Response.json({ error: 'Payload must be an object' }, { status: 400 })
  }

  if ('name' in body && typeof body.name !== 'string') {
    return Response.json({ error: 'Project name must be a string' }, { status: 400 })
  }

  if ('description' in body && body.description !== null && typeof body.description !== 'string') {
    return Response.json({ error: 'Description must be a string' }, { status: 400 })
  }

  const projectName = body.name?.trim() || 'Untitled Project'
  const projectDescription = body.description !== undefined && body.description !== null ? body.description.trim() : null

  try {

    const project = await prisma.project.create({
      data: {
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
