import { auth, currentUser } from "@clerk/nextjs/server"
import { checkProjectAccess } from "@/lib/project-access"
import { liveblocks, getCursorColor } from "@/lib/liveblocks-client"

export async function POST(req: Request) {
  // 1. Require Clerk authentication
  const { userId } = await auth()
  const clerkUser = await currentUser()
  if (!userId || !clerkUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Parse room (project ID) from the request body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Malformed JSON payload" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Payload must be an object" }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const roomId = payload.room
  if (typeof roomId !== "string" || !roomId.trim()) {
    return Response.json({ error: "Room ID (room) is required" }, { status: 400 })
  }

  const cleanRoomId = roomId.trim()

  try {
    // 3. Verify project access using the existing access helper
    const access = await checkProjectAccess(cleanRoomId)
    if (!access.hasAccess || !access.project) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // 4. Ensure the Liveblocks room exists (create only if needed)
    try {
      await liveblocks.getOrCreateRoom(cleanRoomId, {
        defaultAccesses: ["room:write"],
        metadata: {
          title: access.project.name || "Untitled Workspace",
        },
      })
    } catch (roomError) {
      console.error("Failed to get or create Liveblocks room:", roomError)
      return Response.json({ error: "Failed to initialize collaborative session" }, { status: 500 })
    }

    // Get user details for session token
    const email = clerkUser.emailAddresses[0]?.emailAddress || "anonymous@example.com"
    const displayName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email
    const avatarUrl = clerkUser.imageUrl || ""
    const cursorColor = getCursorColor(userId)

    // 5. Return an authorized session token with user metadata
    const { status, body: authBody } = await liveblocks.identifyUser(
      userId,
      {
        userInfo: {
          name: displayName,
          avatar: avatarUrl,
          color: cursorColor,
        },
      }
    )

    return new Response(authBody, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Liveblocks authentication error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
