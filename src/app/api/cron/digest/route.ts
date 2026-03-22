import { NextResponse } from "next/server";
import { db } from "@/db";
import { work } from "@/db/schema/work";
import { user as userTable } from "@/db/schema/auth-schema";
import { sendDigestEmail } from "@/lib/email";
import { eq, inArray, and, not } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingStages = ["new", "triaged", "in_progress", "blocked", "revision"];

    const pendingWork = await db
      .select({
        id: work.id,
        title: work.title,
        stage: work.stage,
        assignedTo: work.assignedTo,
      })
      .from(work)
      .where(and(inArray(work.stage, pendingStages), not(eq(work.stage, "cancelled"))));

    if (pendingWork.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const assigneeIds = [
      ...new Set(pendingWork.map((w) => w.assignedTo).filter(Boolean) as string[]),
    ];

    const users = await db
      .select({ id: userTable.id, email: userTable.email, name: userTable.name })
      .from(userTable)
      .where(inArray(userTable.id, assigneeIds));

    let sent = 0;
    for (const u of users) {
      if (!u.email) continue;
      const userItems = pendingWork.filter((w) => w.assignedTo === u.id);
      if (userItems.length === 0) continue;

      await sendDigestEmail({
        toEmail: u.email,
        toName: u.name ?? u.email,
        items: userItems,
      });
      sent++;
    }

    return NextResponse.json({ sent, total: pendingWork.length });
  } catch (err) {
    console.error("Digest cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
