"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import { notifyWorkAssigned } from "@/actions/notifications";
import { triggerWebhooks } from "@/actions/webhooks";
import { createCalendarEventForWork } from "@/actions/integrations/google-calendar";
import {
  createGithubIssueForWork,
  resolveAssigneeEmail,
} from "@/actions/integrations/github";
import { user as userTable } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

const createWorkSchema = z.object({
  title: z.string().min(1).max(200),
  type: z
    .enum(["task", "meeting", "research", "code", "document", "communication"])
    .optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  assignedTo: z.string().optional(),
  teamId: z.string().optional(),
  priority: z.number().min(1).max(3).optional(),
  dueDate: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  githubRepo: z.string().optional(),
  successCriteria: z.array(z.string()).optional(),
});

export async function createWork(data: z.infer<typeof createWorkSchema>) {
  const user = await requireUser();
  const validated = createWorkSchema.parse(data);

  const [newWork] = await db
    .insert(work)
    .values({
      id: nanoid(),
      title: validated.title,
      type: validated.type || "task",
      description: validated.description,
      instructions: validated.instructions,
      assignedTo: validated.assignedTo,
      teamId: validated.teamId,
      priority: validated.priority || 2,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      meetingUrl: validated.meetingUrl || null,
      githubRepo: validated.githubRepo || null,
      successCriteria: validated.successCriteria,
      createdBy: user.id,
      stage: "new",
    })
    .returning();

  if (validated.assignedTo) {
    notifyWorkAssigned(
      newWork.id,
      validated.assignedTo,
      user.name || undefined,
    ).catch(console.error);
  }

  if (newWork.teamId) {
    triggerWebhooks(newWork.teamId, "work.created", {
      id: newWork.id,
      title: newWork.title,
      type: newWork.type,
      createdBy: user.id,
    }).catch(console.error);

    // Create Google Calendar event for meeting work items
    if (newWork.type === "meeting") {
      let assigneeEmail: string | null = null;
      if (validated.assignedTo) {
        const [assignee] = await db
          .select({ email: userTable.email })
          .from(userTable)
          .where(eq(userTable.id, validated.assignedTo));
        assigneeEmail = assignee?.email ?? null;
      }
      createCalendarEventForWork(newWork.teamId, {
        title: newWork.title,
        description: newWork.description ?? undefined,
        dueDate: newWork.dueDate,
        meetingUrl: newWork.meetingUrl ?? undefined,
        assigneeEmail,
        workId: newWork.id,
      }).catch(console.error);
    }

    // Create GitHub issue for code work items
    if (newWork.type === "code" && validated.githubRepo) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const assigneeEmail = validated.assignedTo
        ? await resolveAssigneeEmail(validated.assignedTo).catch(() => null)
        : null;
      createGithubIssueForWork(newWork.teamId, {
        repo: validated.githubRepo,
        title: newWork.title,
        description: newWork.description ?? undefined,
        assigneeEmail: assigneeEmail ?? undefined,
        workId: newWork.id,
        workUrl: `${appUrl}/dashboard/work/${newWork.id}`,
      })
        .then(async (issueUrl) => {
          if (issueUrl) {
            await db
              .update(work)
              .set({ githubIssueUrl: issueUrl })
              .where(eq(work.id, newWork.id));
          }
        })
        .catch(console.error);
    }
  }

  revalidatePath("/");
  return newWork;
}
