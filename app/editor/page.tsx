import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { EditorWorkspace } from "./editor-workspace"
import { redirect } from "next/navigation"

export default async function EditorPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const emailAddresses = user?.emailAddresses.map((e) => e.emailAddress) || []

  // Fetch owned projects
  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  // Fetch shared projects
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

  // Combine into Project[] shapes
  const initialProjects = [
    ...ownedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.id, // Project ID and Liveblocks room ID are aligned and immutable
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

  return <EditorWorkspace initialProjects={initialProjects} />
}
