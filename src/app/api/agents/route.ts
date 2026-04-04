import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/actions/auth/session";
import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

async function getUserOrThrow() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserOrThrow();
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");

    const conditions = teamId ? [eq(agent.teamId, teamId)] : [];
    const agents = await db.select().from(agent).where(and(...conditions)).orderBy(desc(agent.createdAt));

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("GET agents error:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserOrThrow();
    const body = await request.json();

    const { name, description, teamId, agentType, config, maxConcurrentTasks, rateLimit, systemPrompt, workType } = body;

    const apiKey = nanoid(32);

    const [created] = await db.insert(agent).values({
      id: nanoid(),
      name,
      description,
      teamId,
      ownerId: user.id,
      agentType: agentType || "ai",
      workTypes: workType ? [workType] : ["task"],
      config: {
        ...config,
        apiKey,
        systemPrompt: systemPrompt || "",
      },
      maxConcurrentTasks: String(maxConcurrentTasks || 5),
      rateLimit: String(rateLimit || 60),
      isActive: true,
    }).returning();

    return NextResponse.json({ agent: created });
  } catch (error) {
    console.error("POST agent error:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
