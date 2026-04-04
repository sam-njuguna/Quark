"use server";

import { db } from "@/db";
import { work as workSchema, workOutput } from "@/db/schema/work";
import { agent, agentWorkLog } from "@/db/schema/agent";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireUser } from "@/actions/auth/session";
import { executeWork } from "@/lib/ai-execute";

export async function assignWorkToAgent(workId: string, agentId?: string) {
  const user = await requireUser();

  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(eq(workSchema.id, workId))
    .limit(1);

  if (!workItem) {
    throw new Error("Work not found");
  }

  let targetAgentId = agentId;

  if (!targetAgentId) {
    const aiAgents = await db
      .select()
      .from(agent)
      .where(eq(agent.agentType, "ai"))
      .limit(1);

    const aiAgent = aiAgents[0];

    if (!aiAgent) {
      throw new Error("No AI agent configured");
    }

    targetAgentId = aiAgent.id;
  } else {
    const [agentRecord] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, targetAgentId))
      .limit(1);

    if (!agentRecord) {
      throw new Error("Agent not found");
    }

    if (agentRecord.agentType !== "ai") {
      throw new Error("Selected agent is not an AI agent");
    }
  }

  if (workItem.aiStatus === "running") {
    throw new Error("Work is already assigned to an AI agent");
  }

  const [aiAgent] = await db
    .select()
    .from(agent)
    .where(eq(agent.id, targetAgentId))
    .limit(1);

  if (!aiAgent) {
    throw new Error("Agent not found");
  }

  await db.update(workSchema).set({
    aiAgentId: targetAgentId,
    aiStatus: "running",
    aiStartedAt: new Date(),
    stage: "triaged",
  }).where(eq(workSchema.id, workId));

  await db.insert(agentWorkLog).values({
    id: nanoid(),
    agentId: targetAgentId,
    workId,
    action: "work_assigned",
    message: `Work "${workItem.title}" assigned to agent for autonomous execution`,
  });

  const result = await executeWork({
    workId: workItem.id,
    title: workItem.title,
    description: workItem.description,
    instructions: workItem.instructions,
    successCriteria: workItem.successCriteria,
    workType: workItem.type,
    outputFormat: aiAgent.outputFormat || "markdown",
    systemPrompt: aiAgent.config?.systemPrompt,
  });

  if (result.success && result.output) {
    await db.update(workSchema).set({
      stage: "awaiting_review",
      aiStatus: "completed",
      aiCompletedAt: new Date(),
    }).where(eq(workSchema.id, workId));

    await db.insert(workOutput).values({
      id: nanoid(),
      workId,
      version: 1,
      content: {
        markdown: result.output,
        model: result.model,
      },
      contentType: "markdown",
      submittedBy: aiAgent.ownerId || user.id,
    });

    return { success: true, agentId: targetAgentId, output: result.output };
  } else {
    await db.update(workSchema).set({
      stage: "blocked",
      aiStatus: "failed",
      aiError: result.error,
    }).where(eq(workSchema.id, workId));

    throw new Error(result.error || "AI execution failed");
  }
}

export async function cancelAIExecution(workId: string) {
  const user = await requireUser();

  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(eq(workSchema.id, workId))
    .limit(1);

  if (!workItem) {
    throw new Error("Work not found");
  }

  if (!workItem.aiAgentId) {
    throw new Error("Work is not assigned to an AI agent");
  }

  await db.update(workSchema).set({
    aiStatus: "cancelled",
    aiAgentId: null,
  }).where(eq(workSchema.id, workId));

  await db.insert(agentWorkLog).values({
    id: nanoid(),
    agentId: workItem.aiAgentId,
    workId,
    action: "work_cancelled",
    message: `Work "${workItem.title}" execution cancelled by user`,
  });

  return { success: true };
}

export async function getAvailableAgents() {
  await requireUser();

  const agents = await db
    .select()
    .from(agent)
    .where(eq(agent.agentType, "ai"))
    .orderBy(agent.createdAt);

  return agents;
}
