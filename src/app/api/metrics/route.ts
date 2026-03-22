import { NextResponse } from "next/server";
import { db } from "@/db";
import { work } from "@/db/schema/work";
import { team } from "@/db/schema/teams";
import { user } from "@/db/schema/auth-schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.METRICS_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [workCount] = await db.select({ count: sql<number>`count(*)` }).from(work);
  const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(team);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(user);

  const metrics = [
    `# HELP quark_work_total Total work items`,
    `# TYPE quark_work_total gauge`,
    `quark_work_total ${workCount.count}`,
    `# HELP quark_team_total Total teams`,
    `# TYPE quark_team_total gauge`,
    `quark_team_total ${teamCount.count}`,
    `# HELP quark_user_total Total users`,
    `# TYPE quark_user_total gauge`,
    `quark_user_total ${userCount.count}`,
  ].join("\n");

  return new NextResponse(metrics, {
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}
