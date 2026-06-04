import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { checkProjectAccess } from "@/lib/project-access"
import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspace } from "../editor-workspace"
import { redirect } from "next/navigation"

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params
  
  // 1. Validate project access and existence
  const access = await checkProjectAccess(roomId)
  if (!access.hasAccess || !access.project) {
    return <AccessDenied />
  }

  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const emailAddresses = user?.emailAddresses.map((e) => e.emailAddress) || []

  // 2. Fetch projects for user (matching layout options)
  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  const sharedProjects = await prisma.project.findMany({
    where: {
      collaborators: {
        some: {
          email: { in: emailAddresses },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const ownedIds = new Set(ownedProjects.map((p) => p.id))

  const initialProjects = [
    ...ownedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.id,
      isOwner: true,
    })),
    ...sharedProjects
      .filter((p) => !ownedIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        slug: p.id,
        isOwner: false,
      })),
  ]

  return (
    <EditorWorkspace 
      initialProjects={initialProjects} 
      activeProjectId={roomId} 
    />
  )
}
