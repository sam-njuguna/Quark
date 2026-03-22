# Quark Feature Documentation

Complete documentation of all features in the Quark multi-agent task orchestration platform.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Work Management](#work-management)
3. [Kanban Board](#kanban-board)
4. [Team Management](#team-management)
5. [Real-time Collaboration](#real-time-collaboration)
6. [Sprint Planning](#sprint-planning)
7. [Analytics](#analytics)
8. [Integrations](#integrations)
9. [Notifications](#notifications)
10. [File Management](#file-management)
11. [Settings](#settings)
12. [Database Schema](#database-schema)
13. [API & Actions](#api--actions)

---

## Authentication

### Magic Link / OTP
- Email-based authentication via Better Auth
- No passwords required
- OTP codes sent via Resend email

### Role System
- `admin` - Full access, manage team settings
- `lead` - Manage work items and team members
- `member` - Create and update work items

### API Keys
- MCP (Model Context Protocol) tokens for AI agent integration
- Generated per user in Settings → API Keys
- Bearer token authentication for REST access

---

## Work Management

### Work Types
| Type | Icon Color | Description |
|------|------------|-------------|
| `task` | Blue | General work items |
| `meeting` | Violet | Meetings and sync-ups |
| `research` | Amber | Research activities |
| `code` | Emerald | Code-related work |
| `document` | Sky | Documentation tasks |
| `communication` | Rose | Communication tasks |

### Work Stages (Kanban Columns)
```
new → triaged → in_progress → awaiting_review → revision → blocked → done → cancelled
```

### Priority Levels
- **P1 (Red)** - High priority, urgent
- **P2 (Amber)** - Medium priority, default
- **P3 (Default)** - Low priority

### Work Features
- Rich text descriptions (Tiptap editor)
- Instructions for AI agents
- Success criteria (checklist format)
- Due dates with calendar picker
- Sub-tasks / Dependencies
- Emoji reactions
- Comments with @mentions
- File attachments

---

## Kanban Board

### Core Functionality
- Drag-and-drop cards between columns
- Optimistic UI updates with server sync
- Auto-refresh every 30 seconds
- Quick-create button in each column header
- Context menu for quick stage transitions

### Components
| File | Purpose |
|------|---------|
| `kanban-board.tsx` | Main board container |
| `kanban-column.tsx` | Individual stage column |
| `kanban-card.tsx` | Card display (title, type, priority, due date) |
| `kanban-card-with-detail.tsx` | Card with detail sheet integration |

### Card Actions (Right-click)
- Move to stage (context-aware transitions)
- Approve (in review stage)
- Request Revision (in review stage)
- Block / Unblock
- View Details
- Auto-assign (to lightest workload member)

---

## Team Management

### Team Creation
Multi-step wizard:
1. Basic Info (name, description)
2. Privacy (public/private)
3. Invite Members (email invitations)

### Team Hierarchy
- Teams can have parent teams (org chart)
- Visualized in `/dashboard/hierarchy` using React Flow
- Member avatars displayed on nodes

### Team Switcher
- Sidebar dropdown to switch between teams
- URL parameter persistence (`?team=xxx`)

### Member Management
- Invite via email
- Change roles (admin, lead, member)
- Remove members with confirmation
- Bulk select and delete
- Workload visualization per member

---

## Real-time Collaboration

### Real-time Presence (SSE)
- Online user avatars in Kanban board header
- Connection status indicator (green pulse)
- Broadcasts card moves to team members
- Heartbeat every 30 seconds

### Implementation
| File | Purpose |
|------|---------|
| `use-presence.ts` | Hook for SSE connection |
| `api/presence/route.ts` | SSE endpoint |
| `api/presence/heartbeat/route.ts` | Heartbeat |
| `api/presence/broadcast/route.ts` | Event broadcast |
| `api/presence/leave/route.ts` | Cleanup |

### Redis-backed
- Uses Upstash Redis for event streaming
- Events expire after 120 seconds
- User-specific and team-wide event channels

---

## Sprint Planning

### Sprint Lifecycle
1. **Create** - Name, goals, start/end dates
2. **Start** - Activate sprint, track progress
3. **Complete** - Close sprint, view stats

### Sprint Stats
- Velocity (items completed)
- Burndown
- Completion rate
- Average cycle time

### Components
| File | Purpose |
|------|---------|
| `sprint-card.tsx` | Sprint summary card |
| `create-sprint-dialog.tsx` | Create new sprint |
| `sprint-list.tsx` | Sprint list with stats |

---

## Analytics

### Personal Analytics (`/dashboard/analytics`)
- Cycle time metrics (time in each stage)
- Throughput charts
- Workload summary
- Velocity over time
- Bottleneck analysis (slowest stages)

### Admin Dashboard (`/dashboard/admin`)
- Organization-wide metrics
- Team performance comparison
- Velocity charts
- Bottleneck analysis

### Charts
- Built with Recharts
- Client components only (SSR fix applied)
- shadcn `Chart` wrapper component

---

## Integrations

### Webhooks
- Configure endpoint URLs
- HMAC signature verification
- Retry with exponential backoff
- Delivery logs (`webhook_log` table)

### Stage Automations
- Trigger actions on stage transitions
- Examples: notify on done, escalate on blocked

### Recurring Work
- Cron-based template system
- Auto-create work on schedule
- Requires background job runner

### MCP Tools
- AI agent tool access control
- Per-user enable/disable toggles
- Stored in `api_key.disabledTools` JSONB

---

## Notifications

### Real-time Presence
- SSE streaming for live updates
- Online user indicators
- Card move broadcasts

### Push Notifications
- Browser push notifications
- Service worker (`public/sw.js`)
- VAPID authentication
- Toggle in Settings → Notifications

**Environment Variables:**
```
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_EMAIL=mailto:you@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
```

### Email Notifications
- Work assigned
- Work submitted for review
- Work approved
- Revision requested
- @Mentions in comments

### In-App Notifications
- Notification bell in sidebar
- Per-type toggles in settings

---

## File Management

### File Attachments
- Upload via drag-and-drop
- Vercel Blob storage
- Preview for images and PDFs
- Delete capability

### PDF Viewer
- Inline preview in work detail sheet
- Fullscreen mode
- Download option

**Schema:** `work_attachment` table

---

## Settings

### Profile Tab
- Display name
- Email (read-only)

### MCP Setup Tab
- API key generation
- Configuration examples for:
  - Windsurf / Cursor (Streamable HTTP)
  - Claude Desktop (stdio via mcp-remote)
- Tool access control toggles

### Teams Tab
- Team list
- Member management
- Create new team

### Notifications Tab
- Email notification toggles
- In-app notification toggles
- **Push notifications toggle** (browser)
- Digest settings
- Mute all option

### Webhooks Tab
- Create/edit webhooks
- View delivery logs

### Recurring Tab
- Manage recurring work templates

### API Keys Tab
- MCP token display
- Regenerate token
- REST API documentation

### Automations Tab
- Stage automation rules
- Data export (CSV)

---

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `user` | User accounts |
| `team` | Teams (with `parentId` for hierarchy) |
| `team_member` | Membership with roles |
| `work` | Work items |
| `work_output` | Submitted outputs |
| `work_attachment` | File attachments |

### Collaboration Tables
| Table | Purpose |
|-------|---------|
| `comment` | Work comments |
| `activity` | Audit logs |
| `reactions` | Emoji reactions |
| `work_dependency` | Sub-tasks / dependencies |

### Integration Tables
| Table | Purpose |
|-------|---------|
| `stage_automation` | Stage transition rules |
| `webhook` | Webhook configs |
| `webhook_log` | Delivery logs |
| `recurring_work` | Recurring templates |
| `sprint` | Sprint definitions |
| `sprint_work` | Sprint-work associations |
| `api_key` | MCP tokens |
| `push_subscription` | Browser push subscriptions |

---

## API & Actions

### Server Actions (Recommended)
All data operations use server actions in `src/actions/`:
- `"use server"` directive
- Zod validation on inputs
- Automatic type safety

### API Routes (Required)
Some features require API routes:
| Route | Purpose |
|-------|---------|
| `/api/mcp` | MCP transport |
| `/api/auth/*` | Better Auth |
| `/api/cron/*` | Background jobs |
| `/api/presence/*` | SSE streaming |

### Key Actions
| Module | Actions |
|--------|---------|
| `work/` | create, update, delete, assign, approve, reject, block |
| `team/` | create, invite, updateRole, removeMember, hierarchy |
| `comments/` | add, list |
| `presence/` | broadcast, heartbeat, clear |
| `notifications/` | subscribe, unsubscribe, send |
| `webhooks/` | create, list, delete, test |

---

## Environment Variables

### Required
```
DATABASE_URL=<Neon Postgres>
BETTER_AUTH_SECRET=<Auth secret>
NEXT_PUBLIC_APP_URL=<App URL>
```

### Optional
```
# Email
RESEND_API_KEY=
EMAIL_FROM=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Push Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Neon (Postgres) + pgvector |
| ORM | Drizzle |
| Auth | Better Auth |
| UI | Shadcn + Tailwind v4 |
| Runtime | Bun |
| Charts | Recharts |
| Rich Text | Tiptap |
| Flow Diagrams | React Flow |
| State | nuqs (URL state) |
| Notifications | Sonner (toasts) |

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (MCP, auth, cron, SSE)
│   ├── dashboard/          # Protected pages
│   │   ├── all/           # All work view
│   │   ├── analytics/     # Personal analytics
│   │   ├── admin/        # Admin dashboard
│   │   ├── hierarchy/    # Org chart
│   │   ├── settings/     # Settings pages
│   │   └── team/[id]/   # Team pages
│   └── (auth)/           # Auth pages
├── actions/               # Server actions
│   ├── auth/             # Session & auth
│   ├── work/             # Work CRUD
│   ├── team/             # Team management
│   ├── comments/         # Comments
│   ├── notifications/    # Push notifications
│   └── ...
├── components/           # React components
│   ├── kanban/          # Kanban board
│   ├── settings/        # Settings components
│   ├── work/            # Work-related
│   └── ui/              # shadcn components
├── db/                   # Drizzle ORM
│   ├── schema/          # Table definitions
│   └── index.ts         # DB client
├── hooks/               # Custom React hooks
├── lib/                 # Utilities
└── public/              # Static assets
    └── sw.js           # Service worker
```

---

## Known Issues & Missing Features

### Missing
- GitHub integration (UI scaffolded)
- Google Calendar sync (UI scaffolded)
- Full REST API documentation
- Team deletion

### Known
- Vercel Blob requires `BLOB_READ_WRITE_TOKEN` for file uploads
- Push notifications require VAPID keys (configured)
- Recurring work requires background job runner

---

*Last updated: 2026-03-20*
