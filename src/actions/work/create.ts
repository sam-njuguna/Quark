"use server";

import { db } from "@/db";
import { work, workOutput } from "@/db/schema/work";
import { agent } from "@/db/schema/agent";
import { eq } from "drizzle-orm";
import { requireUser } from "@/actions/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import { triggerWebhooks } from "@/actions/webhooks";
import { createCalendarEventForWork } from "@/actions/integrations/google-calendar";
import { createGithubIssueForWork } from "@/actions/integrations/github";
import { createWorkEmbedding } from "./embeddings";
import { analyzeWork, generateDescription } from "@/lib/ai-triage";
import { executeWork } from "@/lib/ai-execute";

const createWorkSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  teamId: z.string().optional(),
  dueDate: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  githubRepo: z.string().optional(),
  aiAgentId: z.string().optional(),
  aiCustomInstructions: z.string().optional(),
});

export async function createWork(data: z.infer<typeof createWorkSchema>) {
  const user = await requireUser();
  const validated = createWorkSchema.parse(data);

  const aiAnalysis = await analyzeWork(
    validated.title,
    validated.description ?? null,
    undefined
  );

  const finalDescription = validated.description?.trim() || "";

  const [newWork] = await db
    .insert(work)
    .values({
      id: nanoid(),
      title: validated.title,
      type: aiAnalysis.suggestedType,
      description: finalDescription,
      teamId: validated.teamId,
      priority: aiAnalysis.suggestedPriority,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      meetingUrl: validated.meetingUrl || null,
      githubRepo: validated.githubRepo || null,
      createdBy: user.id,
      stage: aiAnalysis.suggestedStage === "in_progress" ? "in_progress" : "new",
      aiAgentId: validated.aiAgentId || null,
      aiStatus: validated.aiAgentId ? "assigned" : null,
      aiStartedAt: validated.aiAgentId ? new Date() : null,
      aiCustomInstructions: validated.aiCustomInstructions || null,
    })
    .returning();

  if (!validated.description?.trim() && validated.title) {
    generateDescription(validated.title).then((desc) => {
      if (desc) {
        db.update(work).set({ description: desc }).where(eq(work.id, newWork.id)).catch(console.error);
      }
    }).catch(console.error);
  }

  if (validated.aiAgentId && newWork.teamId) {
    const [aiAgent] = await db.select().from(agent).where(eq(agent.id, validated.aiAgentId)).limit(1);
    
    if (aiAgent) {
      await db.update(work).set({ 
        stage: "triaged",
        aiStatus: "running",
        aiStartedAt: new Date(),
      }).where(eq(work.id, newWork.id));
      
      const result = await executeWork({
        workId: newWork.id,
        title: newWork.title,
        description: newWork.description,
        instructions: newWork.instructions ?? undefined,
        successCriteria: newWork.successCriteria ?? undefined,
        workType: newWork.type,
        outputFormat: aiAgent.outputFormat || "markdown",
        systemPrompt: aiAgent.config?.systemPrompt,
        customInstructions: validated.aiCustomInstructions,
      });

      if (result.success && result.output) {
        await db.update(work).set({
          stage: "awaiting_review",
          aiStatus: "completed",
          aiCompletedAt: new Date(),
        }).where(eq(work.id, newWork.id));

        await db.insert(workOutput).values({
          id: nanoid(),
          workId: newWork.id,
          version: 1,
          content: {
            markdown: result.output,
            model: result.model,
          },
          contentType: "markdown",
          submittedBy: aiAgent.ownerId || user.id,
        });
      } else {
        await db.update(work).set({
          stage: "blocked",
          aiStatus: "failed",
          aiError: result.error,
        }).where(eq(work.id, newWork.id));
      }
    }
  }

  if (newWork.teamId) {
    triggerWebhooks(newWork.teamId, "work.created", {
      id: newWork.id,
      title: newWork.title,
      type: newWork.type,
      createdBy: user.id,
    }).catch(console.error);

    if (newWork.type === "meeting") {
      createCalendarEventForWork(newWork.teamId, {
        title: newWork.title,
        description: newWork.description ?? undefined,
        dueDate: newWork.dueDate,
        meetingUrl: newWork.meetingUrl ?? undefined,
        assigneeEmail: null,
        workId: newWork.id,
      }).catch(console.error);
    }

    if (newWork.type === "code" && validated.githubRepo) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      createGithubIssueForWork(newWork.teamId, {
        repo: validated.githubRepo,
        title: newWork.title,
        description: newWork.description ?? undefined,
        assigneeEmail: undefined,
        workId: newWork.id,
        workUrl: `${appUrl}/dashboard/work/${newWork.id}`,
      }).catch(console.error);
    }
  }

  revalidatePath("/");

  createWorkEmbedding(
    newWork.title,
    newWork.description,
    newWork.type,
    newWork.id
  ).catch(console.error);

  return newWork;
}
