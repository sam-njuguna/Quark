import { getSession, getUserTeams } from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { getTeamIntegrations } from "@/actions/integrations";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DisconnectButton } from "@/components/integrations/disconnect-button";
import { GitHubRepoConfig } from "@/components/integrations/github-repo-config";
import {
  GithubIcon,
  CalendarIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  PlugZapIcon,
  CheckIcon,
  AlertCircleIcon,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const [teams, activeTeamId] = await Promise.all([
    getUserTeams(session.user.id),
    getActiveTeamId(session.user.id),
  ]);
  const currentTeam =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null;

  const integrations = currentTeam
    ? await getTeamIntegrations(currentTeam.id)
    : [];

  const githubIntegration =
    integrations.find((i) => i.type === "github") ?? null;
  const googleIntegration =
    integrations.find((i) => i.type === "google_calendar") ?? null;

  const currentRole = currentTeam?.role ?? "member";
  const canConfigure = ["lead", "admin"].includes(currentRole);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect Quark to your external tools and services
        </p>
      </div>

      {/* OAuth feedback banners */}
      {params.success && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckIcon className="size-4 shrink-0" />
          {params.success === "github"
            ? "GitHub connected successfully."
            : "Google Calendar connected successfully."}
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
          <AlertCircleIcon className="size-4 shrink-0" />
          {params.error === "github_token_failed"
            ? "GitHub authentication failed. Please try again."
            : params.error === "google_token_failed"
              ? "Google authentication failed. Please try again."
              : "Connection failed. Please try again."}
        </div>
      )}

      {!canConfigure && (
        <div className="rounded-md border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          Integrations are configured by team admins and leads. Contact your
          team admin to connect or disconnect an integration.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* GitHub */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded bg-muted/80 shrink-0">
                <GithubIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  {githubIntegration
                    ? (githubIntegration.config?.login as string)
                      ? `@${githubIntegration.config?.login as string}`
                      : githubIntegration.name
                    : "Sync PRs, issues, and code reviews"}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-widest ${
                githubIntegration
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground/50"
              }`}
            >
              {githubIntegration ? "Connected" : "Not connected"}
            </span>
          </div>
          <div className="px-4 py-3 space-y-3">
            <ul className="space-y-1.5">
              {[
                "Auto-create work items when PRs are opened",
                "Update work stage when PRs are merged",
                "Link commits to work items via branch names",
                "Receive webhook notifications on push events",
              ].map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle2Icon
                    className={`mt-0.5 size-3 shrink-0 ${githubIntegration ? "text-emerald-500" : "text-muted-foreground/30"}`}
                  />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs px-2.5"
                asChild
              >
                <a
                  href="https://docs.github.com/en/rest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon className="size-3" />
                  Docs
                </a>
              </Button>
              {canConfigure && !githubIntegration && currentTeam && (
                <Button
                  size="sm"
                  className="gap-1.5 h-7 text-xs px-2.5"
                  asChild
                >
                  <Link
                    href={`/api/integrations/github/connect?teamId=${currentTeam.id}`}
                  >
                    Connect GitHub
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </Button>
              )}
              {canConfigure && githubIntegration && (
                <DisconnectButton integrationId={githubIntegration.id} />
              )}
            </div>

            {canConfigure && githubIntegration && (
              <GitHubRepoConfig
                integrationId={githubIntegration.id}
                currentRepo={(githubIntegration.config?.repo as string) ?? null}
                webhookUrl={`${appUrl}/api/integrations/github/webhook`}
              />
            )}
          </div>
        </div>

        {/* Google Calendar */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded bg-muted/80 shrink-0">
                <CalendarIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  Google Calendar
                </p>
                <p className="text-xs text-muted-foreground">
                  {googleIntegration
                    ? ((googleIntegration.config?.email as string) ??
                      googleIntegration.name)
                    : "Sync meeting work items to calendars"}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-widest ${
                googleIntegration
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground/50"
              }`}
            >
              {googleIntegration ? "Connected" : "Not connected"}
            </span>
          </div>
          <div className="px-4 py-3 space-y-3">
            <ul className="space-y-1.5">
              {[
                "Create calendar events from meeting work items",
                "Sync due dates to your calendar",
                "Invite assignees automatically",
                "Update event status when work is completed",
              ].map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle2Icon
                    className={`mt-0.5 size-3 shrink-0 ${googleIntegration ? "text-emerald-500" : "text-muted-foreground/30"}`}
                  />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs px-2.5"
                asChild
              >
                <a
                  href="https://developers.google.com/calendar"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon className="size-3" />
                  Docs
                </a>
              </Button>
              {canConfigure && !googleIntegration && currentTeam && (
                <Button
                  size="sm"
                  className="gap-1.5 h-7 text-xs px-2.5"
                  asChild
                >
                  <Link
                    href={`/api/integrations/google/connect?teamId=${currentTeam.id}`}
                  >
                    Connect Google
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </Button>
              )}
              {canConfigure && googleIntegration && (
                <DisconnectButton integrationId={googleIntegration.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PlugZapIcon className="size-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Setup Instructions
          </span>
        </div>
        <div className="rounded-md border bg-card overflow-hidden divide-y">
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              GitHub — after connecting
            </p>
            <ol className="space-y-1">
              {[
                <>
                  Go to your GitHub repo →{" "}
                  <strong>Settings → Webhooks → Add webhook</strong>
                </>,
                <>
                  Set Payload URL to{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    {appUrl}/api/integrations/github/webhook
                  </code>
                </>,
                <>
                  Set Content-Type to{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    application/json
                  </code>
                </>,
                <>Select events: Pull requests, Pushes, Issues</>,
                <>
                  Optionally set a webhook secret and add it as{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    GITHUB_WEBHOOK_SECRET
                  </code>{" "}
                  in env
                </>,
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="tabular-nums font-semibold text-muted-foreground/40 shrink-0 w-3">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Google Calendar — before connecting
            </p>
            <ol className="space-y-1">
              {[
                <>Enable the Google Calendar API in Google Cloud Console</>,
                <>Create OAuth 2.0 credentials (Web application type)</>,
                <>
                  Add authorised redirect URI:{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    {appUrl}/api/integrations/google/callback
                  </code>
                </>,
                <>
                  Add{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    GOOGLE_CLIENT_ID
                  </code>{" "}
                  and{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    GOOGLE_CLIENT_SECRET
                  </code>{" "}
                  to your environment
                </>,
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="tabular-nums font-semibold text-muted-foreground/40 shrink-0 w-3">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
