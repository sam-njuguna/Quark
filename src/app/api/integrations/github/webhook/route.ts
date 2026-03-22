import { db } from "@/db";
import { work } from "@/db/schema/work";
import { integration } from "@/db/schema/integrations";
import { activity } from "@/db/schema/activity";
import { user as userTable } from "@/db/schema/auth-schema";
import { teamMember } from "@/db/schema/teams";
import { and, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification if no secret set
  const sig = req.headers.get("x-hub-signature-256");
  if (!sig) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const body = await req.text();

  if (!(await verifySignature(req, body))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Find which team this webhook belongs to by looking for a github integration
  // that has a matching repo
  const repoFullName = (payload.repository as Record<string, unknown>)
    ?.full_name as string;
  const allGithubIntegrations = await db
    .select()
    .from(integration)
    .where(and(eq(integration.type, "github"), eq(integration.isActive, true)));

  // Find matching integration by repo name stored in config
  const matchedIntegration = allGithubIntegrations.find(
    (i) => !i.config?.repo || i.config?.repo === repoFullName,
  );

  if (!matchedIntegration) {
    return NextResponse.json({ ok: true, skipped: "no matching integration" });
  }

  const teamId = matchedIntegration.teamId;
  const accessToken = (
    matchedIntegration.credentials as Record<string, unknown>
  )?.accessToken as string | undefined;

  // Resolve a GitHub login → Quark userId via the GitHub API
  async function resolveGithubUser(login: string): Promise<string | null> {
    if (!login || !accessToken) return null;
    try {
      const res = await fetch(`https://api.github.com/users/${login}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });
      const data = (await res.json()) as Record<string, unknown>;
      const email = data.email as string | null;
      if (!email) return null;
      const [found] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email));
      return found?.id ?? null;
    } catch {
      return null;
    }
  }

  // Resolve an email directly → Quark userId
  async function resolveByEmail(
    email: string | null | undefined,
  ): Promise<string | null> {
    if (!email || email.includes("noreply.github.com")) return null;
    const [found] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email));
    return found?.id ?? null;
  }

  // Find the actual integration row for metadata
  const [integrationRow] = await db
    .select()
    .from(integration)
    .where(eq(integration.id, matchedIntegration.id));

  // Resolve a valid user ID to use when no GitHub→Quark match is found
  const configAdminId = integrationRow.config?.adminUserId as
    | string
    | undefined;
  let SYSTEM_ACTOR = configAdminId;
  if (!SYSTEM_ACTOR) {
    const [anyAdmin] = await db
      .select({ userId: teamMember.userId })
      .from(teamMember)
      .where(
        and(
          eq(teamMember.teamId, integrationRow.teamId),
          eq(teamMember.role, "admin"),
        ),
      );
    SYSTEM_ACTOR = anyAdmin?.userId;
  }

  if (!SYSTEM_ACTOR) {
    return NextResponse.json({ ok: true, skipped: "no valid actor found" });
  }

  if (event === "pull_request") {
    const pr = payload.pull_request as Record<string, unknown>;
    const action = payload.action as string;
    const prNumber = pr?.number as number;
    const prTitle = pr?.title as string;
    const prUrl = pr?.html_url as string;
    const branchName = (pr?.head as Record<string, unknown>)?.ref as string;

    if (action === "opened" || action === "reopened") {
      const prAuthorLogin = (pr?.user as Record<string, unknown>)
        ?.login as string;
      const authorUserId = await resolveGithubUser(prAuthorLogin);

      // Check if a work item for this PR already exists
      const existingWork = await db
        .select({ id: work.id })
        .from(work)
        .where(
          and(eq(work.teamId, teamId), like(work.title, `%[PR #${prNumber}]%`)),
        )
        .limit(1);

      if (!existingWork.length) {
        const [newWork] = await db
          .insert(work)
          .values({
            id: nanoid(),
            teamId,
            createdBy: authorUserId ?? SYSTEM_ACTOR,
            assignedTo: authorUserId ?? undefined,
            title: `[PR #${prNumber}] ${prTitle}`,
            type: "code",
            stage: "in_progress",
            priority: 2,
            description: `Auto-created from GitHub PR.\n\nRepository: ${repoFullName}\nBranch: \`${branchName}\`\nURL: ${prUrl}`,
          })
          .returning();

        await db.insert(activity).values({
          id: nanoid(),
          workId: newWork.id,
          userId: authorUserId ?? SYSTEM_ACTOR,
          action: "created",
          metadata: {
            source: "github",
            event: "pull_request.opened",
            prNumber,
            prUrl,
            githubLogin: prAuthorLogin,
          },
        });
      }
    }

    if (action === "closed" && (pr?.merged as boolean)) {
      // Find the work item for this PR and mark it done
      const [prWork] = await db
        .select()
        .from(work)
        .where(
          and(eq(work.teamId, teamId), like(work.title, `%[PR #${prNumber}]%`)),
        )
        .limit(1);

      if (prWork && prWork.stage !== "done") {
        const mergerLogin = (payload.sender as Record<string, unknown>)
          ?.login as string;
        const mergerUserId = await resolveGithubUser(mergerLogin);

        await db
          .update(work)
          .set({
            stage: "done",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(work.id, prWork.id));

        await db.insert(activity).values({
          id: nanoid(),
          workId: prWork.id,
          userId: mergerUserId ?? SYSTEM_ACTOR,
          action: "stage_changed",
          metadata: {
            from: prWork.stage,
            to: "done",
            source: "github",
            event: "pull_request.merged",
            githubLogin: mergerLogin,
          },
        });
      }
    }
  }

  if (event === "push") {
    // Link commits to work items via branch name (e.g. branch "work/abc123" → work item abc123)
    const ref = payload.ref as string;
    const branchName = ref?.replace("refs/heads/", "");
    const commits = (payload.commits as Array<Record<string, unknown>>) ?? [];

    const workIdMatch = branchName?.match(/work\/([a-zA-Z0-9_-]+)/);
    if (workIdMatch) {
      const workId = workIdMatch[1];
      const [linkedWork] = await db
        .select({ id: work.id, stage: work.stage })
        .from(work)
        .where(eq(work.id, workId));

      if (linkedWork) {
        const pusherEmail = (payload.pusher as Record<string, unknown>)
          ?.email as string;
        const pusherUserId =
          (await resolveByEmail(pusherEmail)) ??
          (await resolveGithubUser(
            (payload.pusher as Record<string, unknown>)?.name as string,
          ));

        for (const commit of commits.slice(0, 10)) {
          const commitEmail = (commit.author as Record<string, unknown>)
            ?.email as string;
          const commitUserId =
            (await resolveByEmail(commitEmail)) ?? pusherUserId ?? SYSTEM_ACTOR;

          await db.insert(activity).values({
            id: nanoid(),
            workId: linkedWork.id,
            userId: commitUserId,
            action: "comment",
            metadata: {
              source: "github",
              event: "push",
              commitSha: (commit.id as string)?.slice(0, 7),
              message: commit.message,
              url: commit.url,
              authorEmail: commitEmail,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
