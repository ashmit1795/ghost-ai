import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/app/generated/prisma/client"

export interface ProjectAccess {
  hasAccess: boolean
  isOwner: boolean
  project: Prisma.ProjectGetPayload<{ include: { collaborators: true } }> | null
}

export async function getClerkIdentity() {
  const { userId } = await auth()
  if (!userId) {
    return { userId: null, emailAddresses: [] }
  }
  const user = await currentUser()
  const emailAddresses = user?.emailAddresses.map((e) => e.emailAddress.trim().toLowerCase()) || []
  return { userId, emailAddresses }
}

export async function checkProjectAccess(roomId: string): Promise<ProjectAccess> {
  const { userId, emailAddresses } = await getClerkIdentity()
  if (!userId) {
    return { hasAccess: false, isOwner: false, project: null }
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: roomId },
      include: {
        collaborators: true,
      },
    })

    if (!project) {
      return { hasAccess: false, isOwner: false, project: null }
    }

    if (project.ownerId === userId) {
      return { hasAccess: true, isOwner: true, project }
    }

    const isCollaborator = project.collaborators.some((collab) =>
      emailAddresses.includes(collab.email.trim().toLowerCase())
    )

    if (isCollaborator) {
      return { hasAccess: true, isOwner: false, project }
    }

    return { hasAccess: false, isOwner: false, project: null }
  } catch (error) {
    console.error("Failed to check project access:", error)
    throw error // Rethrow to preserve error detail for callers to map to 500
  }
}

