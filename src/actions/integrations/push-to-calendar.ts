"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { user as userTable } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { createCalendarEventForWork } from "@/actions/integrations/google-calendar";
import { eq } from "drizzle-orm";

export async function pushWorkItemToCalendar(workId: string): Promise<{
  success: boolean;
  eventUrl?: string;
  error?: string;
}> {
  await requireUser();

  const [item] = await db
    .select({
      id: work.id,
      title: work.title,
      description: work.description,
      dueDate: work.dueDate,
      meetingUrl: work.meetingUrl,
      teamId: work.teamId,
      assignedTo: work.assignedTo,
      type: work.type,
    })
    .from(work)
    .where(eq(work.id, workId))
    .limit(1);

  if (!item) return { success: false, error: "Work item not found" };
  if (!item.teamId) return { success: false, error: "Work item has no team" };

  let assigneeEmail: string | null = null;
  if (item.assignedTo) {
    const [assignee] = await db
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, item.assignedTo))
      .limit(1);
    assigneeEmail = assignee?.email ?? null;
  }

  const result = await createCalendarEventForWork(item.teamId, {
    title: item.title,
    description: item.description ?? undefined,
    dueDate: item.dueDate,
    meetingUrl: item.meetingUrl ?? undefined,
    assigneeEmail,
    workId: item.id,
  });

  if (!result) {
    return {
      success: false,
      error: "Google Calendar not connected for this team",
    };
  }

  return {
    success: true,
    eventUrl: (result as { htmlLink?: string }).htmlLink ?? undefined,
  };
}
