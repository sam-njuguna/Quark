import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/actions/auth/session";
import { db } from "@/db";
import { agentTask, agent } from "@/db/schema/agent";
import { eq, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

async function getAuthenticatedUser(request: NextRequest) {
  const session = await getSession();
  if (session?.user) {
    return { type: "session" as const, user: session.user };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);
    
    const [agentRecord] = await db
      .select()
      .from(agent)
      .where(sql`${agent.config}->>'apiKey' = ${apiKey}`)
      .limit(1);
    
    if (agentRecord) {
      return { type: "agent" as const, user: { id: agentRecord.ownerId }, agent: agentRecord };
    }
  }

  throw new Error("Unauthorized");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agentId");
    const status = url.searchParams.get("status");

    if (!agentId) {
      return NextResponse.json({ tasks: [] });
    }

    // Verify access: either session user owns the agent or it's the same agent using its own key
    const [agentRecord] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, agentId))
      .limit(1);
    
    if (!agentRecord) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (auth.type === "agent" && auth.agent.id !== agentRecord.id) {
      throw new Error("Unauthorized");
    }

    const tasks = await db
      .select()
      .from(agentTask)
      .where(eq(agentTask.agentId, agentId))
      .orderBy(desc(agentTask.createdAt))
      .limit(50);

    let filteredTasks = tasks;
    if (status) {
      filteredTasks = tasks.filter(t => t.status === status);
    }

    return NextResponse.json({ tasks: filteredTasks });
  } catch (error) {
    console.error("GET tasks error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tasks";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const body = await request.json();

    const { agentId, workId, title, description, instructions, priority } = body;

    if (!agentId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify access: session user owns the agent OR agent is using its own key
    const [agentRecord] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, agentId))
      .limit(1);
    
    if (!agentRecord) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (auth.type === "agent" && auth.agent.id !== agentRecord.id) {
      throw new Error("Unauthorized");
    }

    const [created] = await db.insert(agentTask).values({
      id: nanoid(),
      agentId,
      workId,
      title,
      description,
      instructions,
      priority: priority || "normal",
      status: "pending",
      retryCount: "0",
      maxRetries: "3",
    }).returning();

    return NextResponse.json({ task: created });
  } catch (error) {
    console.error("POST task error:", error);
    const message = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
