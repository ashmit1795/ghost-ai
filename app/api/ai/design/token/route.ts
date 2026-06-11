import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export async function POST(req: Request) {
  const { userId } = await clerkAuth();
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
  const { runId } = payload;

  if (typeof runId !== "string" || !runId.trim()) {
    return Response.json({ error: "Run ID must be a non-empty string" }, { status: 400 });
  }

  try {
    // 1. Verify ownership/existence of the TaskRun record
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return Response.json({ error: "Task run not found" }, { status: 404 });
    }

    // Verify ownership or project collaboration access
    if (taskRun.userId !== userId) {
      const access = await checkProjectAccess(taskRun.projectId);
      if (!access.hasAccess) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 2. Generate a Trigger.dev public token scoped to this run and task
    const token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
          tasks: ["design-agent"],
        },
      },
      expirationTime: "1h",
    });

    return Response.json({ token });
  } catch (error) {
    console.error("POST /api/ai/design/token error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
