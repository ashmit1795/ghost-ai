import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { checkProjectAccess } from "@/lib/project-access"

interface RouteParams {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(req: Request, { params }: RouteParams) {
  const { projectId } = await params

  // 1. Verify project access
  const access = await checkProjectAccess(projectId)
  if (!access.hasAccess || !access.project) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    })

    if (collaborators.length === 0) {
      return Response.json([])
    }

    // 2. Fetch and enrich profiles from Clerk Backend API
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList({
      emailAddress: collaborators.map((c) => c.email),
    })

    const enriched = collaborators.map((collab) => {
      const clerkUser = clerkUsers.data.find((u) =>
        u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === collab.email.toLowerCase())
      )
      return {
        id: collab.id,
        email: collab.email,
        createdAt: collab.createdAt,
        name: clerkUser ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null : null,
        imageUrl: clerkUser?.imageUrl || null,
      }
    })

    return Response.json(enriched)
  } catch (error) {
    console.error("Error fetching collaborators:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const { projectId } = await params

  // 1. Verify requester is the project owner
  const access = await checkProjectAccess(projectId)
  if (!access.hasAccess || !access.project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }
  if (!access.isOwner) {
    return Response.json({ error: "Forbidden: Only owners can invite collaborators" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return Response.json({ error: "Email address is required" }, { status: 400 })
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 })
    }

    // 2. Enforce owner cannot invite themselves
    const client = await clerkClient()
    const owner = await client.users.getUser(access.project.ownerId)
    const ownerEmails = owner.emailAddresses.map((e) => e.emailAddress.toLowerCase())

    if (ownerEmails.includes(email)) {
      return Response.json({ error: "You cannot invite the owner of the workspace" }, { status: 400 })
    }

    // 3. Check if already a collaborator
    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: { projectId, email },
      },
    })

    if (existing) {
      return Response.json({ error: "User is already a collaborator" }, { status: 400 })
    }

    // 4. Create collaborator in database
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        email,
      },
    })

    // 5. Query Clerk to return enriched data immediately
    const clerkUsers = await client.users.getUserList({
      emailAddress: [email],
    })

    const clerkUser = clerkUsers.data.find((u) =>
      u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email)
    )

    return Response.json({
      id: collaborator.id,
      email: collaborator.email,
      createdAt: collaborator.createdAt,
      name: clerkUser ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null : null,
      imageUrl: clerkUser?.imageUrl || null,
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating collaborator:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { projectId } = await params

  // 1. Verify requester is the project owner
  const access = await checkProjectAccess(projectId)
  if (!access.hasAccess || !access.project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }
  if (!access.isOwner) {
    return Response.json({ error: "Forbidden: Only owners can remove collaborators" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { id } = body

    if (!id) {
      return Response.json({ error: "Collaborator ID is required" }, { status: 400 })
    }

    // 2. Remove collaborator entry
    await prisma.projectCollaborator.delete({
      where: {
        id,
        projectId, // Extra safety check to ensure deletion is scoped to this project
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
