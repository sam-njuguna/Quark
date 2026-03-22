import {
  getSession,
  getUserTeams,
  getSystemRole,
  isPrivilegedUser,
} from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { getOrCreateMcpToken } from "@/actions/api-keys/mcp-token";
import { getTeamMembers, getTeamInvitations } from "@/actions/team/members";
import { listWebhooks } from "@/actions/webhooks";
import { listRecurringWork } from "@/actions/recurring";
import { listAutomations } from "@/actions/automations";
import { StageAutomationsManager } from "@/components/settings/stage-automations-manager";
import { TeamMembersManager } from "@/components/settings/team-members-manager";
import { McpToolToggles } from "@/components/settings/mcp-tool-toggles";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { PushNotificationsSettings } from "@/components/settings/push-notifications-settings";
import { getDisabledTools } from "@/actions/api-keys/tool-settings";
import { getTeamToolPolicy } from "@/actions/api-keys/tool-policy";
import { TeamToolPolicyEditor } from "@/components/settings/team-tool-policy-editor";
import { WebhooksManager } from "@/components/settings/webhooks-manager";
import { RecurringWorkManager } from "@/components/settings/recurring-work-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/code-block";
import {
  BotIcon,
  CodeIcon,
  PlugIcon,
  UsersIcon,
  WebhookIcon,
  ShieldIcon,
  MailIcon,
  RepeatIcon,
  KeyIcon,
  ZapIcon,
  DownloadIcon,
  LockIcon,
} from "lucide-react";
import { RegenerateTokenButton } from "@/components/regenerate-token-button";
import { ParentTeamSelector } from "@/components/team/parent-team-selector";
import { CreateTeamButton } from "@/components/settings/create-team-button";
import { GlobalInviteDialog } from "@/components/settings/global-invite-dialog";
import { TeamManagementPanel } from "@/components/settings/team-management-panel";
import { listAllTeamsFlat } from "@/actions/team/hierarchy";
import { getMyAvailability } from "@/actions/availability";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences";
import { getNotificationPreferences } from "@/actions/notifications/preferences";

export default async function SettingsPage() {
  const session = await getSession();
  const userId = session!.user!.id;
  const user = session?.user;

  const [teams, activeTeamId, systemRole, privileged, allTeamsFlat] =
    await Promise.all([
      getUserTeams(userId),
      getActiveTeamId(userId),
      getSystemRole(userId),
      isPrivilegedUser(userId),
      getSystemRole(userId).then((r) =>
        r === "super_admin"
          ? listAllTeamsFlat().catch(() => [])
          : Promise.resolve([] as Awaited<ReturnType<typeof listAllTeamsFlat>>),
      ),
    ]);

  const currentTeam =
    teams.find((t) => t.id === activeTeamId) ?? teams[0] ?? null;
  const currentUserRole =
    (currentTeam as { role?: string } | null)?.role ?? "member";
  const canManageTeam = ["lead", "admin"].includes(currentUserRole);
  const isSuperAdmin = systemRole === "super_admin";

  const teamBlockedTools = currentTeam
    ? await getTeamToolPolicy(currentTeam.id).catch(() => [] as string[])
    : ([] as string[]);

  const [
    teamMembers,
    teamInvitations,
    existingWebhooks,
    recurringItems,
    automations,
    disabledTools,
    notificationPrefs,
  ] = await Promise.all([
    currentTeam && canManageTeam
      ? getTeamMembers(currentTeam.id)
      : Promise.resolve([]),
    currentTeam && canManageTeam
      ? getTeamInvitations(currentTeam.id).catch(() => [])
      : Promise.resolve([]),
    currentTeam ? listWebhooks(currentTeam.id) : Promise.resolve([]),
    currentTeam ? listRecurringWork(currentTeam.id) : Promise.resolve([]),
    currentTeam ? listAutomations(currentTeam.id) : Promise.resolve([]),
    getDisabledTools().catch(() => [] as string[]),
    getNotificationPreferences().catch(
      () =>
        ({}) as Parameters<
          typeof NotificationPreferencesForm
        >[0]["initialPrefs"],
    ),
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const myAvailability = await getMyAvailability().catch(() => null);

  let mcpToken = null;
  try {
    mcpToken = await getOrCreateMcpToken();
  } catch {
    // User not logged in
  }

  const mcpConfigStreamable = {
    quark: {
      url: `${appUrl}/api/mcp`,
      headers: {
        Authorization: `Bearer ${mcpToken?.key || "your-api-key-here"}`,
      },
    },
  };

  const mcpConfigStdio = {
    quark: {
      command: "npx",
      args: [
        "-y",
        "mcp-remote",
        `${appUrl}/api/mcp`,
        "--header",
        `Authorization: Bearer ${mcpToken?.key || "your-api-key-here"}`,
      ],
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your account, teams, and integrations
        </p>
      </div>

      <SettingsTabs
        tabs={[
          { value: "profile", label: "Profile" },
          { value: "mcp", label: "MCP Setup" },
          ...(canManageTeam ? [{ value: "teams", label: "Teams" }] : []),
          { value: "notifications", label: "Notifications" },
          ...(canManageTeam
            ? [
                { value: "webhooks", label: "Webhooks" },
                { value: "recurring", label: "Recurring" },
              ]
            : []),
          { value: "api-keys", label: "API Keys" },
          ...(canManageTeam
            ? [{ value: "automations", label: "Automations" }]
            : []),
        ]}
      >
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium">{user?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {isSuperAdmin && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-rose-500 text-white">
                        Super Admin
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 capitalize"
                    >
                      {currentUserRole}
                    </Badge>
                    {currentTeam && (
                      <span className="text-[10px] text-muted-foreground">
                        in {currentTeam.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  defaultValue={user?.name || ""}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                Set your working hours and current status so teammates know when
                you&apos;re reachable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myAvailability ? (
                <AvailabilityForm
                  initialStatus={myAvailability.status}
                  initialNote={myAvailability.statusNote}
                  initialSchedule={myAvailability.weeklySchedule}
                  initialTimezone={myAvailability.timezone}
                  initialShowAvailability={myAvailability.showAvailability}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Unable to load availability settings.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last changed: Never (using magic link)
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Change Password
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Sessions</p>
                  <p className="text-xs text-muted-foreground">
                    Managed automatically — this app uses magic link / OTP auth
                    with no persistent password sessions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mcp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <BotIcon className="size-3.5" />
                MCP Configuration
              </CardTitle>
              <CardDescription className="mt-0.5">
                Connect your AI assistant to Quark via Model Context Protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PlugIcon className="size-4" />
                  <span>
                    Endpoint:{" "}
                    <code className="text-foreground">{appUrl}/api/mcp</code>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CodeIcon className="size-4" />
                  Windsurf / Cursor (Streamable HTTP)
                </h4>
                <p className="text-sm text-muted-foreground">
                  For IDEs that support Streamable HTTP transport directly:
                </p>
                <CodeBlock
                  language="json"
                  title="mcp_config.json"
                  code={JSON.stringify(mcpConfigStreamable, null, 2)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CodeIcon className="size-4" />
                  Claude Desktop (stdio via mcp-remote)
                </h4>
                <p className="text-sm text-muted-foreground">
                  For clients that only support stdio transport:
                </p>
                <CodeBlock
                  language="json"
                  title="claude_desktop_config.json"
                  code={JSON.stringify(mcpConfigStdio, null, 2)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <ZapIcon className="size-4" />
                  Tool Access Control
                </h4>
                <p className="text-sm text-muted-foreground">
                  Toggle which tools are available to AI agents using your API
                  key.
                </p>
                <McpToolToggles
                  initialDisabled={disabledTools as string[]}
                  readOnly={!canManageTeam && !privileged}
                  teamBlockedTools={teamBlockedTools}
                />
              </div>
            </CardContent>
          </Card>

          {isSuperAdmin && currentTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  <LockIcon className="size-3.5" />
                  Team Tool Policy
                </CardTitle>
                <CardDescription>
                  Block specific MCP tools for all members of{" "}
                  <strong>{currentTeam.name}</strong>. Blocked tools override
                  individual settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamToolPolicyEditor
                  teamId={currentTeam.id}
                  teamName={currentTeam.name}
                  initialBlockedTools={teamBlockedTools}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {/* Team Overview - visible to all users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                    <UsersIcon className="size-3.5" />
                    Your Teams
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Teams you are a member of
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {canManageTeam && (
                    <GlobalInviteDialog
                      teams={
                        teams as {
                          id: string;
                          name: string;
                          role?: string | null;
                        }[]
                      }
                      defaultTeamId={currentTeam?.id}
                    />
                  )}
                  {(isSuperAdmin || currentUserRole === "admin") && (
                    <CreateTeamButton />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {teams.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <UsersIcon className="size-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">No teams yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a team to collaborate with others
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map(
                    (t: { id: string; name: string; role?: string | null }) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {t.role || "member"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                          {t.role || "member"}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Administration - only for leads/admins */}
          {currentTeam && canManageTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  <ShieldIcon className="size-3.5" />
                  {currentTeam.name} — Administration
                </CardTitle>
                <CardDescription>
                  Manage team members, hierarchy, and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Members section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Members</h4>
                  <TeamMembersManager
                    teamId={currentTeam.id}
                    teamName={currentTeam.name}
                    members={
                      teamMembers as Parameters<
                        typeof TeamMembersManager
                      >[0]["members"]
                    }
                    invitations={
                      teamInvitations as Parameters<
                        typeof TeamMembersManager
                      >[0]["invitations"]
                    }
                    currentUserId={session!.user!.id}
                    currentUserRole={
                      ((currentTeam as { role?: string }).role as
                        | "member"
                        | "lead"
                        | "admin") ?? "member"
                    }
                  />
                </div>

                <Separator />

                {/* Hierarchy section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Team Hierarchy</h4>
                  <ParentTeamSelector
                    currentTeam={currentTeam}
                    allTeams={teams}
                  />
                </div>

                {/* Tool Policy section - only for super admins */}
                {isSuperAdmin && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Tool Policy</h4>
                      <TeamToolPolicyEditor
                        teamId={currentTeam.id}
                        teamName={currentTeam.name}
                        initialBlockedTools={teamBlockedTools}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Super Admin: All Teams Management */}
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  <ShieldIcon className="size-3.5" />
                  All Teams
                </CardTitle>
                <CardDescription>
                  Create, edit or delete any team. Super admin only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamManagementPanel
                  teams={allTeamsFlat}
                  isSuperAdmin={isSuperAdmin}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <PushNotificationsSettings />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <MailIcon className="size-3.5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which events send you an email or appear in-app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreferencesForm initialPrefs={notificationPrefs!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <WebhookIcon className="size-3.5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receive HTTP POST requests when events occur in Quark
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentTeam ? (
                <WebhooksManager
                  teamId={currentTeam.id}
                  initialWebhooks={existingWebhooks}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Join a team to manage webhooks.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <PlugIcon className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">External Integrations</p>
                <p className="text-xs text-muted-foreground">
                  Connect GitHub, Google Calendar, and more
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0 text-xs gap-1.5"
            >
              <a href="/dashboard/integrations">
                <PlugIcon className="size-3" />
                Manage Integrations
              </a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <RepeatIcon className="size-3.5" />
                Recurring Work
              </CardTitle>
              <CardDescription>
                Templates that auto-create work on a schedule. Requires a
                background job runner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentTeam ? (
                <RecurringWorkManager
                  teamId={currentTeam.id}
                  initialItems={recurringItems}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Join a team to manage recurring work.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <KeyIcon className="size-3.5" />
                MCP Token
              </CardTitle>
              <CardDescription>
                Used by AI agents to connect to Quark via the Model Context
                Protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mcpToken ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Your token
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs truncate">
                        {mcpToken.key}
                      </code>
                      <RegenerateTokenButton />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(mcpToken.createdAt).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No token yet. Generate one above.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <KeyIcon className="size-3.5" />
                REST API Access
              </CardTitle>
              <CardDescription>
                Use your MCP token as a Bearer token for direct REST API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 border p-4 space-y-3">
                <p className="text-sm font-medium">Authentication header</p>
                <code className="block font-mono text-xs text-muted-foreground">
                  Authorization: Bearer {mcpToken?.key ?? "<your-token>"}
                </code>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Available endpoints</p>
                <div className="space-y-1">
                  {(
                    [
                      ["GET", "/api/mcp", "MCP protocol endpoint"],
                      ["GET", "/dashboard", "Dashboard (authenticated)"],
                    ] as [string, string, string][]
                  ).map(([method, path, desc]) => (
                    <div key={path} className="flex items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className="font-mono w-10 justify-center text-[10px]"
                      >
                        {method}
                      </Badge>
                      <code className="text-muted-foreground">{path}</code>
                      <span className="text-muted-foreground">— {desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Your MCP token also works as a REST Bearer token. Full REST API
                documentation coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <ZapIcon className="size-3.5" />
                Stage Automations
              </CardTitle>
              <CardDescription>
                Trigger automatic actions when work moves to a stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentTeam ? (
                <StageAutomationsManager
                  teamId={currentTeam.id}
                  initial={automations}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Join a team to create automations.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                <DownloadIcon className="size-3.5" />
                Data Export
              </CardTitle>
              <CardDescription>Download your work data as CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2" asChild>
                <a href="/api/export/work" download>
                  <DownloadIcon className="size-4" />
                  Export all work (CSV)
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </SettingsTabs>
    </div>
  );
}
