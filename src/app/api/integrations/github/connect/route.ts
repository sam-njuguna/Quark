import { getSession } from "@/actions/auth/session";
import { db } from "@/db";
import { teamMember } from "@/db/schema/teams";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId)
    return NextResponse.json({ error: "teamId required" }, { status: 400 });

  const [membership] = await db
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, session.user.id),
      ),
    );

  if (!membership || !["lead", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId)
    return NextResponse.json(
      { error: "GitHub integration not configured" },
      { status: 500 },
    );

  const state = Buffer.from(
    JSON.stringify({ teamId, userId: session.user.id }),
  ).toString("base64url");
  const scope = "repo,admin:repo_hook,read:org";
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}&state=${state}`;

  return NextResponse.redirect(url);
}
