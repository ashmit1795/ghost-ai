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

  try {
    const body = await req.json().catch(() => ({}))
    const projectName = body.name?.trim() || 'Untitled Project'
    const projectDescription = body.description?.trim() || null

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
