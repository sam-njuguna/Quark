import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/actions/auth/session";
import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = await requireUser();
    const { agentId } = await params;

    const tasks = await db.select().from(agentTask).where(eq(agentTask.agentId, agentId));
    const logs = await db.select().from(agentWorkLog).where(eq(agentWorkLog.agentId, agentId));

    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const failed = tasks.filter(t => t.status === "failed").length;

    return NextResponse.json({
      totalTasks: tasks.length,
      pending,
      inProgress,
      completed,
      failed,
      totalLogs: logs.length,
    });
  } catch (error) {
    console.error("Agent stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
