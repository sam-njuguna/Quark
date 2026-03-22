# Quark — Feature Map

> All app routes, their purpose, how they interconnect, and features that are currently **not connected** or only partially wired up.

---

## App Structure Overview

```
quark/
├── src/app/
│   ├── (auth)/           # Login / verify OTP
│   ├── dashboard/
│   │   ├── page.tsx              → Dashboard (personal)
│   │   ├── all/                  → All Work (full work list)
│   │   ├── work/[id]/            → Work Detail
│   │   ├── new/                  → Create Work
│   │   ├── team/                 → Team View
│   │   ├── analytics/            → Personal Analytics
│   │   ├── admin/                → Org Admin
│   │   ├── audit/                → Audit Trail
│   │   ├── hierarchy/            → Org Chart
│   │   ├── integrations/         → External Integrations
│   │   └── settings/             → Settings (all tabs)
│   └── share/work/[id]/          → Public share view (no auth)
└── src/app/api/
    ├── mcp/                      → MCP protocol endpoint
    ├── export/work/              → CSV export
    ├── metrics/                  → Prometheus metrics
    └── work/stream/              → Streaming CSV export
```

---

## Feature Connections (Connected)

### Core Data Flow

```
User ──────────────┐
                   ▼
Auth Session ──► Work Items ◄──── MCP Agents (via /api/mcp)
                   │
        ┌──────────┼───────────────────┐
        ▼          ▼                   ▼
    Team         Activity          Attachments
        │          │
        ▼          ▼
   Analytics    Audit Trail
```

### Route → Data Dependencies

| Route                     | Primary Data                            | Secondary Data                                                                         |
| ------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `/dashboard`              | `listMyWork`                            | `getMyAnalytics`, `listMyActivity`, `getTeamMembers`                                   |
| `/dashboard/all`          | `listWork`                              | `getUserTeams`, `getTeamMembers`                                                       |
| `/dashboard/work/[id]`    | `getWork`                               | `getWorkAttachments`, `getTeamMembers`                                                 |
| `/dashboard/new`          | form → `createWork`                     | `listAllUsers`, `getUserTeams`                                                         |
| `/dashboard/team`         | `listTeamWork`, `getTeamAnalytics`      | `getTeamMemberWorkloads`, `getTeamSprints`, `getSprintBurndown`                        |
| `/dashboard/analytics`    | `getMyAnalytics`, `getMyVelocityByWeek` | `getMyBottleneckStages`, `getMyWorkloadSummary`                                        |
| `/dashboard/admin`        | `getTeamAnalytics` (all teams)          | `getTeamMemberWorkloads`, `getTeamMembers`, `getVelocityByWeek`, `getBottleneckStages` |
| `/dashboard/audit`        | `activity` table (direct DB)            | `work`, `user` joins                                                                   |
| `/dashboard/hierarchy`    | `getOrgTree`                            | —                                                                                      |
| `/dashboard/settings`     | `getUserTeams`, `getTeamMembers`        | `getOrCreateMcpToken`, `listWebhooks`, `listRecurringWork`, `listAutomations`          |
| `/dashboard/integrations` | session only                            | — (static content)                                                                     |

### Cross-Feature Links

```
Dashboard ─────────────► Work Items (kanban board)
Dashboard ─────────────► Personal KPI (getMyAnalytics)
Dashboard ─────────────► Activity Feed (listMyActivity)

Team ──────────────────► Work Items (team kanban)
Team ──────────────────► Team KPI (getTeamAnalytics)
Team ──────────────────► Workload (getTeamMemberWorkloads)
Team ──────────────────► Sprints (getTeamSprints)

Admin ─────────────────► All Teams KPI (aggregated)
Admin ─────────────────► People (all team members)
Admin ─────────────────► Per-team charts (velocity, bottleneck)

Analytics ─────────────► Personal metrics (velocity, bottleneck, workload)
Analytics ─────────────► Work-by-stage bars
Analytics ─────────────► Work-by-type chips

Audit Trail ───────────► Activity events (all work mutations)
Work Detail ───────────► Activity (comments, stage changes logged)
Work Detail ───────────► Outputs (AI agent submissions)

Settings/Teams ────────► TeamMembersManager (invite, role, remove)
Settings/MCP ──────────► MCP Token (create/regenerate)
Settings/MCP ──────────► McpToolToggles (per-tool enable/disable)
Settings/Webhooks ─────► WebhooksManager (CRUD webhooks per team)
Settings/Automations ──► StageAutomationsManager (trigger on stage change)
Settings/Recurring ────► RecurringWorkManager (scheduled work templates)
Settings/API Keys ─────► MCP token + REST endpoint docs

Hierarchy ─────────────► OrgChartFlow (reads team.parentId tree)
Hierarchy ─────────────► Settings (links to Settings → Teams to manage)

MCP API (/api/mcp) ────► All work CRUD tools
MCP API ───────────────► Activity logging (every agent action logged)
MCP API ───────────────► McpToolToggles (tools can be disabled per user)

Webhooks ──────────────► Integrations (GitHub, Slack use the same webhook system)
```

---

## Disconnected / Partially Wired Features

These features have UI present but are **not fully implemented** or have **broken/missing connections**.

### 🔴 Not Implemented (UI only)

| Feature                                         | Location                                  | Issue                                                                                                               |
| ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **GitHub OAuth / sync**                         | `/dashboard/integrations`                 | Page shows docs only. No OAuth flow, no webhook handler at `/api/integrations/github/*`, no PR→Work mapping exists. |
| **Google Calendar sync**                        | `/dashboard/integrations`                 | Same — docs only. No OAuth, no `/api/integrations/google/callback`, no calendar event creation.                     |
| **Digest Settings**                             | `Settings → Notifications`                | Preferences are now saved to DB per-user, but no daily digest job or cron exists to actually send the email.        |
| **Password change**                             | `Settings → Profile → Security`           | Button is `disabled` — expected. App uses magic link / OTP auth only.                                               |
| **Slack, Linear, Discord, Notion integrations** | `Settings → Webhooks → Integrations grid` | Listed as "Soon" — no implementation, no routing, no configuration UI.                                              |
| **Configure buttons**                           | `/dashboard/integrations`                 | "Configure" buttons on GitHub and Google Calendar have no `href` or `onClick`.                                      |

### 🟡 Partially Connected

| Feature                | Location                               | Issue                                                                                                                                                                                                                                                  |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Push Notifications** | `Settings → Notifications`             | `PushNotificationsSettings` component exists and requests browser permission, but unclear whether a push service (VAPID/FCM) is configured or if notifications are actually sent.                                                                      |
| **Sprints**            | `/dashboard/team`                      | `SprintManager` and `getSprintBurndown` are wired and functional, but sprint _creation_ UI completeness varies.                                                                                                                                        |
| **Public Share**       | `/share/work/[id]`                     | Route works. Now also has a **Copy link** button in Work Detail header for quick sharing. Discovery improved.                                                                                                                                          |
| **Outputs review**     | `/dashboard/work/[id]`                 | AI agent outputs are displayed when present. The **Review Queue** quick filter in Presets now surfaces `awaiting_review` items.                                                                                                                        |
| **Blocked reason**     | `/dashboard/work/[id]`                 | `blockWork` action exists and **Mark Blocked** button is in `WorkDetailActions` — users can set a blocked reason from the UI. ✅ Connected.                                                                                                            |
| **CSV Export**         | `Settings → Automations → Data Export` | `/api/export/work` works but has no date range or team filter.                                                                                                                                                                                         |
| **Prometheus metrics** | `/api/metrics`                         | Route exists with `METRICS_SECRET` bearer auth, not documented externally.                                                                                                                                                                             |
| **Recurring Work**     | `Settings → Recurring`                 | The `/api/cron/recurring` endpoint **exists** and is fully implemented (bearer-auth via `CRON_SECRET`). Wire it to Vercel Cron or an external scheduler by calling `GET /api/cron/recurring` with `Authorization: Bearer <CRON_SECRET>` on a schedule. |
| **Stage Automations**  | `Settings → Automations`               | `StageAutomationsManager` UI saves rules but trigger point in `updateWork` needs verification.                                                                                                                                                         |

### 🟢 Fully Connected

All core work CRUD, authentication, team management, analytics, audit trail, MCP integration, and webhook delivery are fully connected.

---

## Orphaned / Unreachable UI

| Element                    | File                    | Status                                                          |
| -------------------------- | ----------------------- | --------------------------------------------------------------- |
| `SessionManagement` button | `settings/page.tsx`     | ✅ Fixed — replaced with explanatory note about magic link auth |
| `Configure` (GitHub/GCal)  | `integrations/page.tsx` | Still unimplemented — no OAuth backend                          |
| `/share/work/[id]`         | `app/share/`            | ✅ Improved — Copy link button in Work Detail header            |
| `Create New Team` button   | `settings/page.tsx`     | ✅ Fixed — opens `TeamCreationWizard` dialog                    |

---

## Completed Connections (from feature map audit)

| Item                                                                               | Status             |
| ---------------------------------------------------------------------------------- | ------------------ |
| Notification preference switches now save to `user_notification_preferences` table | ✅ Done            |
| "Create New Team" button opens `TeamCreationWizard` dialog                         | ✅ Done            |
| Review Queue quick filter in Presets popover                                       | ✅ Done            |
| Mark Blocked already in `WorkDetailActions`                                        | ✅ Already existed |
| `/api/cron/recurring` endpoint already fully implemented                           | ✅ Already existed |
| "View Sessions" dead button replaced with auth explanation                         | ✅ Done            |
| Copy link button in Work Detail header                                             | ✅ Done            |

## Remaining Gaps

1. **GitHub / Google Calendar OAuth** — No backend. Needs OAuth app credentials, callback routes, and DB integration rows.
2. **Digest email send** — Preferences save, but no background job sends the digest. Needs a cron endpoint + email template.
3. **Stage automations trigger** — Verify `updateWork` / `updateStage` checks `stage_automations` table and fires actions on transition.
4. **Prometheus metrics docs** — Document exported metrics and provide a sample Grafana dashboard config.
