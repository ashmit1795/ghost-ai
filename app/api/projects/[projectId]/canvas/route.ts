import { prisma } from "@/lib/prisma"
import { checkProjectAccess } from "@/lib/project-access"
import { put } from "@vercel/blob"

interface RouteParams {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(req: Request, { params }: RouteParams) {
  const { projectId } = await params

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not configured in the environment")
    return Response.json({ error: "Storage configuration error" }, { status: 500 })
  }

  try {
    // 1. Verify project access (checks authentication + owner/collaborator)
    const access = await checkProjectAccess(projectId)
    if (!access.project) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }
    if (!access.hasAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. No snapshot saved yet — return null; this is normal for new projects
    if (!access.project.canvasJsonPath) {
      return Response.json({ canvas: null })
    }

    // 3. Download from Vercel Blob server-side using the read/write token
    //    Plain fetch() on a private blob returns 401 — supplying the Bearer token
    //    authenticates the request without any SDK-specific download helper.
    try {
      const res = await fetch(access.project.canvasJsonPath, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      })
      if (!res.ok) {
        console.warn(`Vercel Blob fetch failed (${res.status}): ${res.statusText}`)
        return Response.json({ canvas: null })
      }
      const canvas = await res.json()
      return Response.json({ canvas })
    } catch (downloadErr) {
      // Blob was deleted or network issue — degrade gracefully
      console.error("Failed to download canvas from Vercel Blob:", downloadErr)
      return Response.json({ canvas: null })
    }
  } catch (error) {
    console.error("GET /api/projects/[projectId]/canvas error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  const { projectId } = await params

  try {
    // 1. Verify project access
    const access = await checkProjectAccess(projectId)
    if (!access.project) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }
    if (!access.hasAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Parse request JSON payload
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: "Malformed JSON payload" }, { status: 400 })
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return Response.json({ error: "Payload must be an object" }, { status: 400 })
    }

    const payload = body as Record<string, any>
    if (!payload.nodes || !payload.edges) {
      return Response.json({ error: "Missing required nodes or edges lists" }, { status: 400 })
    }

    if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
      return Response.json({ error: "nodes and edges must be arrays" }, { status: 400 })
    }

    const isValidNode = (node: any) =>
      node && typeof node === "object" && typeof node.id === "string" && typeof node.type === "string"

    const isValidEdge = (edge: any) =>
      edge && typeof edge === "object" && typeof edge.id === "string" && typeof edge.source === "string" && typeof edge.target === "string"

    if (!payload.nodes.every(isValidNode) || !payload.edges.every(isValidEdge)) {
      return Response.json({ error: "Malformed node or edge structure" }, { status: 400 })
    }

    // 3. Upload JSON to Vercel Blob using private access (matches private store config)
    const jsonString = JSON.stringify({
      nodes: payload.nodes,
      edges: payload.edges,
    })

    const blob = await put(`canvas/${projectId}.json`, jsonString, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    })

    // 4. Persist the blob URL on the Project record
    await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasJsonPath: blob.url,
      },
    })

    return Response.json({ url: blob.url })
  } catch (error) {
    console.error("PUT /api/projects/[projectId]/canvas error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
