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
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=missing_params`);
  }

  let teamId: string;
  try {
    ({ teamId } = JSON.parse(Buffer.from(state, "base64url").toString()));
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=invalid_state`);
  }

  const redirectUri = `${appUrl}/api/integrations/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json() as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=google_token_failed`);
  }

  // Fetch the connected Google account email
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json() as { email?: string; name?: string };

  const [existing] = await db
    .select({ id: integration.id })
    .from(integration)
    .where(and(eq(integration.teamId, teamId), eq(integration.type, "google_calendar")));

  if (existing) {
    await db
      .update(integration)
      .set({
        credentials: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        },
        config: { email: profile.email, name: profile.name },
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existing.id));
  } else {
    await db.insert(integration).values({
      id: nanoid(),
      teamId,
      type: "google_calendar",
      name: `Google Calendar (${profile.email ?? "connected"})`,
      credentials: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
      config: { email: profile.email, name: profile.name },
      isActive: true,
    });
  }

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=google`);
}
