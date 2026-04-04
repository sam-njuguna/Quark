"use server";

import { db } from "@/db";
import { work as workSchema, workOutput } from "@/db/schema/work";
import { agent } from "@/db/schema/agent";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { executeWork } from "@/lib/ai-execute";
import { requireUser } from "@/actions/auth/session";

export async function triggerAIExecution(workId: string) {
  const user = await requireUser();

  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(eq(workSchema.id, workId))
    .limit(1);

  if (!workItem) {
    throw new Error("Work not found");
  }

  if (workItem.aiStatus === "running") {
    throw new Error("AI is already running on this work item");
  }

  const aiAgents = await db
    .select()
    .from(agent)
    .where(eq(agent.agentType, "ai"))
    .limit(1);

  const aiAgent = aiAgents[0];

  if (!aiAgent) {
    throw new Error("No AI agent configured");
  }

  await db.update(workSchema).set({
    aiAgentId: aiAgent.id,
    aiStatus: "running",
    aiStartedAt: new Date(),
    stage: "triaged",
  }).where(eq(workSchema.id, workId));

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

    return { success: true, output: result.output };
  } else {
    await db.update(workSchema).set({
      stage: "blocked",
      aiStatus: "failed",
      aiError: result.error,
    }).where(eq(workSchema.id, workId));

    throw new Error(result.error || "AI execution failed");
  }
}
