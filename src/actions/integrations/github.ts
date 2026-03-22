"use server";

import { db } from "@/db";
import { integration } from "@/db/schema/integrations";
import { user as userTable } from "@/db/schema/auth-schema";
import { and, eq } from "drizzle-orm";

interface GithubRepo {
  full_name: string;
  name: string;
  private: boolean;
}

export async function listGithubRepos(teamId: string): Promise<GithubRepo[]> {
  const [row] = await db
    .select({ credentials: integration.credentials })
    .from(integration)
    .where(and(eq(integration.teamId, teamId), eq(integration.type, "github"), eq(integration.isActive, true)));

  if (!row) return [];
  const token = (row.credentials as Record<string, unknown>)?.accessToken as string | undefined;
  if (!token) return [];

  try {
    const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=pushed&type=all", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    const data = await res.json() as GithubRepo[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createGithubIssueForWork(
  teamId: string,
  input: {
    repo: string;
    title: string;
    description?: string;
    assigneeEmail?: string | null;
    workId: string;
    workUrl: string;
  },
): Promise<string | null> {
  const [row] = await db
    .select({ credentials: integration.credentials })
    .from(integration)
    .where(and(eq(integration.teamId, teamId), eq(integration.type, "github"), eq(integration.isActive, true)));

  if (!row) return null;
  const token = (row.credentials as Record<string, unknown>)?.accessToken as string | undefined;
  if (!token) return null;

  // Try to resolve assignee email → GitHub username
  let githubAssignee: string | undefined;
  if (input.assigneeEmail) {
    try {
      const searchRes = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(input.assigneeEmail)}+in:email`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
      );
      const searchData = await searchRes.json() as { items?: Array<{ login: string }> };
      githubAssignee = searchData.items?.[0]?.login;
    } catch { /* ignore */ }
  }

  const body = [
    input.description,
    `---\n🔗 Quark work item: ${input.workUrl}`,
  ].filter(Boolean).join("\n\n");

  try {
    const res = await fetch(`https://api.github.com/repos/${input.repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title,
        body,
        ...(githubAssignee ? { assignees: [githubAssignee] } : {}),
      }),
    });
    const issue = await res.json() as { html_url?: string };
    return issue.html_url ?? null;
  } catch {
    return null;
  }
}

export async function resolveAssigneeEmail(userId: string): Promise<string | null> {
  const [found] = await db
    .select({ email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId));
  return found?.email ?? null;
}
