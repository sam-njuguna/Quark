import { db } from "@/db";
import { recurringWork } from "@/db/schema/recurring-work";
import { work } from "@/db/schema/work";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function nextRunAfter(
  pattern: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
): Date {
  const now = new Date();
  if (pattern === "daily") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  if (pattern === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }
  const d = new Date(now);
  d.setMonth(d.getMonth() + 1);
  d.setDate(dayOfMonth ?? 1);
  return d;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await db
    .select()
    .from(recurringWork)
    .where(eq(recurringWork.isActive, true));

  const pending = due.filter(
    (r) => !r.nextRunAt || new Date(r.nextRunAt) <= now,
  );

  const created: string[] = [];
  for (const r of pending) {
    const [newWork] = await db
      .insert(work)
      .values({
        id: nanoid(),
        title: r.templateTitle,
        type: (r.templateType as "task") ?? "task",
        description: r.templateDescription ?? undefined,
        instructions: r.templateInstructions ?? undefined,
        teamId: r.teamId,
        createdBy: r.createdBy,
        stage: "new",
        priority: r.templatePriority ?? 2,
      })
      .returning();

    const nextRunAt = nextRunAfter(r.pattern, r.dayOfWeek, r.dayOfMonth);
    await db
      .update(recurringWork)
      .set({ lastRunAt: now, nextRunAt })
      .where(eq(recurringWork.id, r.id));

    created.push(newWork.id);
  }

  return NextResponse.json({ ok: true, created: created.length });
}
