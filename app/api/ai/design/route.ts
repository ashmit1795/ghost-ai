import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Payload must be an object" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const { prompt, projectId, roomId } = payload;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "Prompt must be a non-empty string" }, { status: 400 });
  }

  if (typeof projectId !== "string" || !projectId.trim()) {
    return Response.json({ error: "ProjectId must be a non-empty string" }, { status: 400 });
  }

  if (typeof roomId !== "string" || !roomId.trim()) {
    return Response.json({ error: "RoomId must be a non-empty string" }, { status: 400 });
  }

  try {
    // 1. Verify project access
    const access = await checkProjectAccess(projectId);
    if (!access.project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    if (!access.hasAccess) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Trigger the design-agent background task
    const run = await tasks.trigger("design-agent", {
      prompt,
      roomId,
      projectName: access.project.name,
      projectDescription: access.project.description ?? "",
    });

    // 3. Store the TaskRun record in the database for tracking
    await prisma.taskRun.create({
      data: {
        runId: run.id,
        projectId,
        userId,
      },
    });

    return Response.json({ runId: run.id });
  } catch (error) {
    console.error("POST /api/ai/design error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
