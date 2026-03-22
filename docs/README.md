# Quark - Multi-Agent Task Orchestration Platform

## Overview

Quark is a multi-agent orchestration platform where humans collaborate through their AI agents. It provides a comprehensive work management system with real-time collaboration, team management, and AI-powered automation.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon (Postgres) + pgvector
- **ORM**: Drizzle
- **Auth**: Better Auth (magic link/OTP)
- **UI**: Shadcn + Tailwind v4
- **Runtime**: Bun
- **Charts**: Recharts
- **Rich Text**: Tiptap
- **Flow Diagrams**: React Flow (XY Flow)

---

## Core Features

### [x] Authentication & Authorization

- Magic link / OTP email authentication via Better Auth
- Team-based role system: `admin`, `lead`, `member`
- API key management for MCP integrations

### [x] Work Management

- **Kanban Board** with drag-and-drop stage transitions
- **Work Types**: task, meeting, research, code, document, communication
- **Stages**: new → triaged → in_progress → awaiting_review → revision → blocked → done → cancelled
- **Priority Levels**: P1 (high), P2 (medium), P3 (low)
- **Due Dates** with calendar support
- **Rich Text Editor** (Tiptap) for descriptions and instructions
- **Success Criteria** with checklist format

### [x] Team Management

- Create teams with multi-step wizard
- Invite members via email
- Role management (promote/demote)
- **Team Hierarchy / Org Chart** with parent-child relationships
- Team switcher in sidebar

### [x] Collaboration Features

- **Comments** with @mention parsing and XSS sanitization
- **Emoji Reactions** on work items
- **Sub-tasks** / Dependencies between work items
- **Real-time Presence** (SSE) - see online team members
- **Context Menu** on Kanban cards for quick actions

### [x] Sprint Planning

- Create sprints with start/end dates and goals
- Start/complete sprint workflows
- Sprint statistics (velocity, burndown, completion rate)
- Add/remove work items from sprints

### [x] Analytics

- Personal analytics page (`/dashboard/analytics`)
  - Cycle time metrics
  - Throughput charts
  - Workload summary
- Admin dashboard (`/dashboard/admin`)
  - Organization-wide metrics
  - Team performance comparison
  - Velocity charts
  - Bottleneck analysis

### [x] Integrations

- **Webhook Support** with HMAC signature verification
- **Webhook Delivery Logs** for debugging
- **Stage Automations** - trigger actions on stage transitions
- **Recurring Work** with cron scheduling
- **CSV Export** for work data
- **MCP Tool Filtering** per-user enable/disable

### [x] Infrastructure

- Error boundaries with loading skeletons
- Rate limiting (Upstash Redis)
- CSP / security headers
- Vercel Analytics
- Audit trail page

---

## File Attachments & Rich Content

### [x] File Attachments (Vercel Blob)

- Upload files to work items via drag-and-drop
- File type detection and icons
- Preview for images and PDFs
- Delete attachments

### [x] PDF Viewer

- Inline PDF preview in work detail sheet
- Fullscreen mode
- Download option

---

## Notifications

### [x] Real-time Presence (SSE)

- Online user indicators in KanbanBoard header
- Broadcast card moves to team members
- Heartbeat-based connection management
- Redis-backed event streaming

### [x] Push Notifications

- Browser push notification support with VAPID keys configured
- Service worker (`public/sw.js`) for handling push events
- Subscribe/unsubscribe endpoints (`/api/notifications/push/*`)
- Settings toggle in `/dashboard/settings` under Notifications tab
- Enable/disable notifications from browser with permission prompt

---

## Database Schema

### Core Tables

- `user` - User accounts
- `team` - Teams (with parentId for hierarchy)
- `team_member` - Team membership with roles
- `work` - Work items
- `work_output` - Submitted work outputs
- `work_attachment` - File attachments
- `comment` - Work item comments
- `activity` - Activity/audit logs
- `reactions` - Emoji reactions
- `work_dependency` - Work item dependencies
- `stage_automation` - Stage transition rules
- `webhook` - Webhook configurations
- `webhook_log` - Webhook delivery logs
- `recurring_work` - Recurring work schedules
- `sprint` - Sprint definitions
- `sprint_work` - Sprint-work item associations
- `api_key` - API keys for MCP
- `push_subscription` - Browser push subscriptions

---

## Directory Structure

```
src/
├── app/
│   ├── api/                    # API Routes (only MCP, cron, auth)
│   │   ├── [transport]/       # MCP HTTP transport
│   │   ├── auth/              # Better Auth routes
│   │   └── cron/              # Cron endpoints
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── all/               # All work view
│   │   ├── analytics/         # Personal analytics
│   │   ├── audit/            # Audit trail
│   │   ├── hierarchy/         # Org chart
│   │   ├── integrations/      # Integrations page
│   │   ├── new/               # Create work
│   │   ├── settings/          # Settings pages
│   │   └── team/              # Team page with sprints
│   └── (root)/                # Public pages (login, etc.)
├── actions/                    # Server Actions
│   ├── auth/                  # Authentication actions
│   ├── automations/            # Stage automation actions
│   ├── comments/              # Comment CRUD
│   ├── dependencies/          # Work dependency actions
│   ├── mcp/                   # MCP-related actions
│   ├── notifications/         # Push notification actions
│   ├── reactions/              # Emoji reaction actions
│   ├── recurring/              # Recurring work actions
│   ├── sprints/                # Sprint management
│   ├── team/                  # Team management
│   │   ├── hierarchy.ts       # Org chart actions
│   │   ├── members.ts         # Member management
│   │   └── role.ts            # Role management
│   └── work/                  # Work item actions
│       ├── analytics.ts       # Analytics queries
│       ├── attachments.ts     # File attachment actions
│       ├── create.ts          # Create work
│       ├── export.ts          # CSV export
│       ├── get.ts             # Get single work
│       ├── list.ts            # List work items
│       ├── search.ts          # Search work
│       ├── submit.ts          # Submit work output
│       ├── update-stage.ts    # Stage transitions
│       └── upload-file.ts     # File upload
├── components/
│   ├── app-sidebar.tsx        # Main sidebar navigation
│   ├── kanban/                # Kanban board components
│   ├── layout/                # Layout components
│   ├── settings/              # Settings UI
│   ├── sprints/               # Sprint components
│   ├── team/                  # Team & org chart components
│   │   └── org-chart-flow.tsx # React Flow org chart
│   ├── ui/                    # Shadcn UI components
│   └── work/                  # Work item components
│       ├── file-upload.tsx    # File upload UI
│       ├── pdf-viewer.tsx     # PDF preview
│       └── work-detail-sheet.tsx
├── db/
│   ├── index.ts               # DB client
│   ├── migrate.ts            # Migration runner
│   ├── schema/               # Drizzle schema files
│   └── seed.ts               # Database seeding
├── hooks/                    # React hooks
│   ├── use-push-notifications.ts
│   └── use-presence.ts       # Real-time presence (SSE)
└── lib/
    ├── auth.ts               # Better Auth config
    ├── rate-limit.ts         # Redis rate limiting
    └── utils.ts              # Utility functions
```

### New Components (2026-03-20)

- `command-palette.tsx` - ⌘K command palette for quick navigation
- `theme-provider.tsx` - Next-themes provider for dark/light mode
- `theme-toggle.tsx` - Theme switcher dropdown
- `empty-state.tsx` - Reusable empty state component
- `push-notifications-settings.tsx` - Push notifications toggle
- `service-worker-registration.tsx` - Service worker registration

---

## Known Issues & Missing Features

### Critical

- [x] **Database Migration Done**: `parentId` added to `team` table (migration 0006)

### Push Notifications

- [x] VAPID keys configured in `.env`
- [x] Service worker created for push handling (`public/sw.js`)
- [x] UI toggle for enabling/disabling push notifications

### Team Hierarchy

- [x] Org chart visualization (done)
- [x] UI to set parent team in settings (`ParentTeamSelector` component)
- [x] UI to manage team hierarchy directly

### API Routes (Still Using)

- `/api/[transport]` - MCP HTTP transport (required)
- `/api/auth/*` - Better Auth (required)
- `/api/cron/*` - Cron jobs (required)

### Missing UI Components

- [x] Work detail page as full page (`/dashboard/work/[id]`)
- [x] Sprint burndown chart visualization (wired into SprintManager)
- [x] Audit log filtering and search (`AuditFilters` component)
- [x] Integration settings pages (GitHub, Google Calendar — `IntegrationsSettings` component with connect/disconnect flows)
- [x] API key management UI (`ApiKeysSettings` component — create, show once, copy, revoke with confirmation)

### Data Integrity

- [x] Work item deletion cascades properly (`deleteWork` server action)
- [x] Team deletion handles member reassignment (`src/actions/team/delete.ts` — re-parents children, optionally migrates members)
- [x] User deletion handles all related data (`src/actions/user/delete.ts` — nullifies/reassigns work, removes memberships)

### Performance

- [x] Work list pagination (offset support in `listWork`)
- [x] Kanban board virtualization for large lists (`useVirtualList` hook — activates at >20 items per column)
- [x] Analytics caching (`unstable_cache` in analytics.ts)

### Testing

- [x] Unit tests for server actions (`src/__tests__/unit/` — Bun test runner; `bun test`)
- [x] Integration tests (`src/__tests__/unit/work-views.test.ts` — localStorage integration)
- [x] E2E tests with Playwright (`src/__tests__/e2e/auth.spec.ts` + `playwright.config.ts`; run `bun test:e2e`)

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=your-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Quark<onboarding@your-domain.com>

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# File Storage (optional)
BLOB_READ_WRITE_TOKEN=...

# Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## Development

```bash
# Install dependencies
bun install

# Run migrations
bun run db:migrate

# Start dev server
bun run dev

# Type check
bun run type-check

# Lint
bun run lint

# Format
bun run format
```

---

## Improvements & Polish

### UX/UI Enhancements

- [x] Loading skeletons for all async operations (team, audit, analytics, hierarchy, work detail)
- [x] Empty states with illustrations and helpful CTAs
- [x] Toast notifications for all user actions (success/error feedback)
- [x] Keyboard shortcuts (`n` for new work, `/` for search, `⌘K` command palette)
- [x] Command palette (⌘K) for quick navigation
- [x] Dark/light mode toggle with system preference detection
- [x] Mobile-responsive design improvements (responsive utilities in globals.css)
- [x] Animation polish (fade-in, slide-up, scale-in keyframes + prefers-reduced-motion)
- [x] Focus management and accessibility improvements (ARIA labels — `useFocusTrap` hook, aria-label on all icon buttons, semantic HTML guidelines in `docs/ui.md`)

### Features to Add

- [x] Work item templates (predefined structures — `src/lib/work-templates.ts` + `WorkTemplatePicker`)
- [x] Bulk actions on work items (multi-select — `BulkActionsBar` + `src/actions/work/bulk.ts`)
- [x] Timeline/Gantt view for work items (`WorkTimeline` component)
- [x] Calendar view for due dates (`DueDateCalendar` component with overdue detection)
- [x] Time tracking on work items (schema + `TimeTracker` UI + server actions)
- [x] Work item cloning (`cloneWork` server action + UI button)
- [x] Activity feed on work items (comment author info, audit log)
- [x] @mention notifications via email (wired in `addComment`)
- [x] GitHub integration UI (link PRs/commits — `GithubIntegration` component)
- [x] Email notifications digest (daily/weekly — `/api/cron/digest` route)
- [x] Work item sharing (public links — `/share/work/[id]`)
- [x] Comments threading (parentId schema + migration 0007)
- [x] Markdown preview in comments (edit/preview toggle with `MarkdownPreview`)
- [x] Drag-and-drop file reordering (`FileListDnd` component using native HTML5 DnD API)
- [x] Custom fields on work items (schema + migration 0007)
- [x] Work item views (save filters — `SavedViewsBar` + `src/lib/work-views.ts` with localStorage)
- [x] Dashboard widgets customization (`WidgetGrid` component with localStorage persistence)

### Technical Improvements

- [x] Streaming responses for large data (CSV export via `ReadableStream` at `/api/work/stream`)
- [x] Optimistic UI updates (kanban stage transitions roll back on error; `updateWork` server action)
- [x] Query caching (Next.js `unstable_cache` on analytics; kanban auto-refresh every 30s)
- [x] Image compression before upload (`useImageCompression` hook)
- [x] Progressive image loading (`ProgressiveImage` component with blur-to-clear transition)
- [x] Bundle size optimization (`optimizePackageImports` for lucide-react/recharts/date-fns, `compress: true`, source maps off, AVIF/WebP images in `next.config.ts`)
- [x] Critical CSS extraction (Tailwind v4 + Next.js App Router per-page CSS — automatic; no extra config needed)
- [x] Service worker for offline support (install/activate/fetch caching in `public/sw.js`)
- [x] PWA manifest and icons (`public/manifest.json`)
- [x] Real-time collaboration (in-memory locking via `src/lib/locking.ts` — `acquireLock`/`releaseLock`/`getLockStatus`)
- [x] Database query optimization (indexes added on all new tables)
- [x] Background job processing (in-process job queue `src/lib/jobs.ts` with retry logic)
- [x] Feature flags system (`src/lib/feature-flags.ts`)
- [x] A/B testing framework (`src/lib/ab-testing.ts` — cookie-based deterministic variant assignment)
- [x] Error tracking (`src/app/global-error.tsx` — Next.js global error boundary with Sentry hook point)
- [x] Logging (structured logs — `src/lib/logger.ts`)
- [x] Metrics/monitoring (Prometheus-format `/api/metrics` endpoint — requires `METRICS_SECRET`)
- [x] Backup strategy (`scripts/backup.sh` — pg_dump with optional S3 upload + retention pruning)

---

## Last Updated

2026-03-20 (v2)
