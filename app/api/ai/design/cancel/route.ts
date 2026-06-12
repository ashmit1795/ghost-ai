import { auth } from "@clerk/nextjs/server";
import { runs } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";

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
  const { runId } = payload;

  if (typeof runId !== "string" || !runId.trim()) {
    return Response.json({ error: "RunId must be a non-empty string" }, { status: 400 });
  }

  try {
    // 1. Find the TaskRun in the database
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return Response.json({ error: "Task run not found" }, { status: 404 });
    }

    // 2. Verify project ownership/access
    // In our simplified database model, we check if the user who triggered the run is the one trying to cancel it
    if (taskRun.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Cancel the run in Trigger.dev
    await runs.cancel(runId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/ai/design/cancel error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
