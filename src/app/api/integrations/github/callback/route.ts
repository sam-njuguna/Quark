import { db } from "@/db";
import { integration } from "@/db/schema/integrations";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/integrations?error=missing_params`,
    );
  }

  let teamId: string;
  let adminUserId: string | undefined;
  try {
    ({ teamId, userId: adminUserId } = JSON.parse(
      Buffer.from(state, "base64url").toString(),
    ));
  } catch {
    return NextResponse.redirect(
      `${appUrl}/dashboard/integrations?error=invalid_state`,
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/integrations?error=github_token_failed`,
    );
  }

  // Fetch GitHub user info for the label
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const ghUser = (await userRes.json()) as { login?: string };

  // Upsert integration record for this team
  const [existing] = await db
    .select({ id: integration.id })
    .from(integration)
    .where(and(eq(integration.teamId, teamId), eq(integration.type, "github")));

  const config = { login: ghUser.login, adminUserId };

  if (existing) {
    await db
      .update(integration)
      .set({
        credentials: { accessToken: tokenData.access_token },
        config,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existing.id));
  } else {
    await db.insert(integration).values({
      id: nanoid(),
      teamId,
      type: "github",
      name: `GitHub (${ghUser.login ?? "connected"})`,
      credentials: { accessToken: tokenData.access_token },
      config,
      isActive: true,
    });
  }

  return NextResponse.redirect(
    `${appUrl}/dashboard/integrations?success=github`,
  );
}
