"use server";

import { db } from "@/db";
import { integration } from "@/db/schema/integrations";
import { and, eq } from "drizzle-orm";

interface CalendarEventInput {
  title: string;
  description?: string;
  dueDate?: Date | null;
  meetingUrl?: string;
  assigneeEmail?: string | null;
  workId: string;
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function createCalendarEventForWork(
  teamId: string,
  input: CalendarEventInput,
) {
  const [gcalIntegration] = await db
    .select()
    .from(integration)
    .where(
      and(
        eq(integration.teamId, teamId),
        eq(integration.type, "google_calendar"),
        eq(integration.isActive, true),
      ),
    );

  if (!gcalIntegration) return null;

  const creds = gcalIntegration.credentials as {
    accessToken?: string;
    refreshToken?: string;
  };

  let accessToken = creds.accessToken;

  // Try a quick probe; refresh if 401
  const testRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (testRes.status === 401 && creds.refreshToken) {
    accessToken = (await refreshGoogleToken(creds.refreshToken)) ?? undefined;
    if (!accessToken) return null;
    // Persist refreshed token
    await db
      .update(integration)
      .set({
        credentials: { ...creds, accessToken },
        updatedAt: new Date(),
      })
      .where(eq(integration.id, gcalIntegration.id));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const start = input.dueDate ?? new Date(Date.now() + 86400000);
  const end = new Date(start.getTime() + 3600000); // 1 hour default

  const descParts = [
    input.description,
    input.meetingUrl ? `Join: ${input.meetingUrl}` : null,
    `Quark work item: ${appUrl}/dashboard/work/${input.workId}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const event: Record<string, unknown> = {
    summary: input.title,
    description: descParts,
    start: { dateTime: start.toISOString(), timeZone: "UTC" },
    end: { dateTime: end.toISOString(), timeZone: "UTC" },
  };

  if (input.assigneeEmail) {
    event.attendees = [{ email: input.assigneeEmail }];
  }

  const createRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  if (!createRes.ok) return null;
  const created = (await createRes.json()) as {
    id?: string;
    htmlLink?: string;
  };
  return created;
}
