import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/actions/auth/session";
import { db } from "@/db";
import { agentWorkLog, agent } from "@/db/schema/agent";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = await requireUser();
    const { agentId } = await params;
    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");

    const conditions = [eq(agentWorkLog.agentId, agentId)];
    if (taskId) conditions.push(eq(agentWorkLog.taskId, taskId));

    const logs = await db
      .select()
      .from(agentWorkLog)
      .where(eq(agentWorkLog.agentId, agentId))
      .orderBy(desc(agentWorkLog.createdAt))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Agent logs error:", error);
    return NextResponse.json({ error: "Failed to get logs" }, { status: 500 });
  }
}
