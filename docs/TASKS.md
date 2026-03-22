# Quark — Active Tasks

Based on codebase analysis as of 2026-03-20.

---

## Pending

*All tasks completed!*

---

## Done

### Notifications

- [x] **Real-time presence** — SSE for live card moves and online user indicators in KanbanBoard
- [x] **Push notifications** — browser push notifications with VAPID keys, service worker, and settings toggle

### Core Features

- [x] **Kanban persistence fix** — `KanbanBoard.handleDrop` calls `updateStage` directly with optimistic revert
- [x] **Tiptap rich-text editor** — replaced `Textarea` in `create-work-form.tsx` for `description` and `instructions` fields
- [x] **nuqs URL state** — all filter/view/type/stage params in `/dashboard/all` page use `nuqs` for shareable URLs
- [x] **Settings tab URL state** — active settings tab persisted in `?tab=` via nuqs shallow routing
- [x] **Tiptap SSR fix** — added `immediatelyRender: false` to `useEditor` to suppress hydration mismatch
- [x] **Team management UI** — invite dialog, role change, remove with confirm, multi-select + bulk delete, permissions display in `TeamMembersManager`
- [x] **MCP tool toggles** — per-user enable/disable of individual MCP tool calls stored in `api_key.disabledTools` JSONB

### UX / Flows

- [x] **Quick-create dialog** — `CreateWorkForm` works as a dialog via `QuickCreateButton` in Kanban column headers
- [x] **Stage creation from view** — column header "+" button opens pre-filled create-work dialog with stage preset
- [x] **Kanban card quick-stage** — right-click context menu on kanban cards for fast stage transitions
- [x] **Team switcher** — active switch between multiple teams in the sidebar team switcher with URL param persistence

### Team

- [x] **Team creation wizard** — multi-step dialog for creating a new team from settings (Basic Info → Privacy → Invite)
- [x] **Team hierarchy** — org chart structure with parent-child relationships and `OrgChart` component

### Analytics

- [x] **My analytics page** — personal cycle time, throughput, workload summary, velocity charts, bottleneck analysis
- [x] **Velocity + bottleneck charts** — on admin page
- [x] **Chart SSR fix** — charts use client components with proper `ChartTooltipContent`
- [x] **Sprint planning** — create sprints, start/complete sprints, sprint cards with stats on team page

### Infrastructure

- [x] Error boundaries + loading skeletons
- [x] Rate limiting (Upstash)
- [x] CSP / security headers
- [x] Webhook HMAC signature + exponential backoff retry
- [x] Vercel Analytics
- [x] Comment @mention parsing + XSS sanitization
- [x] API routes refactored to use server actions with Zod validation
- [x] Unnecessary API routes deleted (only MCP transport, auth, and cron remain)

### Work Management

- [x] Work dependencies schema + actions + sub-tasks UI
- [x] Emoji reactions schema + actions + UI in work detail
- [x] Stage automations schema + manager + settings tab
- [x] Webhook delivery logs schema + delivery logging
- [x] Recurring work cron API route
- [x] CSV export API
- [x] Audit trail page
- [x] Integrations scaffold page (GitHub + Google Calendar)
- [x] Sidebar links for audit trail + integrations
- [x] File attachments — upload files to work items (Vercel Blob), display in detail sheet
- [x] PDF viewer — inline preview of submitted PDF work outputs in detail sheet
