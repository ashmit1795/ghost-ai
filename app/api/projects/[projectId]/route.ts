import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    projectId: string
  }>
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if ('name' in body) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return Response.json({ error: 'Project name is required' }, { status: 400 })
      }
    }

    if ('description' in body) {
      if (body.description !== null && typeof body.description !== 'string') {
        return Response.json({ error: 'Description must be a string' }, { status: 400 })
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name !== undefined ? body.name.trim() : project.name,
        description: body.description !== undefined ? (body.description === null ? null : body.description.trim()) : project.description,
      }
    })
    return Response.json(updatedProject)
  } catch (error) {
    console.error('Failed to update project:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.project.delete({
      where: { id: projectId }
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
