# Quark - AI-Driven Work Management Platform

## Overview

Quark is being transformed into a multi-agent orchestration platform where 70% of work is AI-driven. The platform focuses on removing manual human-centric features and enabling AI to auto-detect, execute, and complete work items.

---

## Features Implemented

### 1. Simplified Create Work Form

**Location:** `src/components/work/create-work-form.tsx`

- Removed manual type selector (AI auto-detects)
- Removed priority selector (AI assigns)
- Removed instructions field
- Removed success criteria field
- Removed assignee dropdown
- Kept essential fields: Title, Description, Team, Due Date, Meeting URL, GitHub Repo

### 2. AI Auto-Description Generation

**Location:** `src/actions/work/create.ts`

- When no description is provided, AI generates one asynchronously after work creation
- Uses `generateDescription()` from `@/lib/ai-triage`

### 3. AI Auto-Triage on Work Creation

**Location:** `src/actions/work/create.ts`

- On work creation, AI analyzes the title to determine:
  - Suggested type (task, meeting, research, code, document, communication)
  - Suggested priority (1, 2, 3)
  - Suggested stage (new, triaged, in_progress)

### 4. AI Execution on Work Creation

**Location:** `src/actions/work/create.ts`

- When an agent is selected during work creation, AI executes immediately
- Sets stage progression: `new` → `triaged` → `awaiting_review` (on success) or `blocked` (on failure)
- Stores output in `workOutput` table

### 5. Custom Instructions for AI

**Locations:**
- `src/db/schema/work.ts` - Added `aiCustomInstructions` field
- `src/actions/work/create.ts` - Passes custom instructions to AI
- `src/lib/ai-execute.ts` - Appends custom instructions to system prompt
- `src/components/work/create-work-form.tsx` - Textarea for custom instructions

Users can describe custom rules the AI should follow (e.g., "Use simple language", "Include code examples").

### 6. AI Activity Page

**Location:** `src/app/dashboard/analytics/page.tsx`

- Shows statistics: running, completed, failed, success rate
- Route: `/dashboard/analytics`

### 7. Updated Sidebar Navigation

**Location:** `src/components/app-sidebar.tsx`

- Removed "My Work" - now shows: All Work, Team, Calendar, AI Activity

### 8. Deleted Unused Routes

Removed admin, analytics, audit, hierarchy pages that are no longer needed.

### 9. Fixed Kanban Cards

**Location:** `src/components/kanban/kanban-card.tsx`

- Added "failed" AI status badge
- Shows AI badges: running (blue), assigned (purple), completed (green), failed (red)

### 10. Fixed Select Component Error

**Location:** `src/components/work/create-work-form.tsx`

- Removed empty string value from agent dropdown that caused runtime crash

### 11. Added AI Fields to Work List Queries

**Location:** `src/actions/work/list.ts`

- Added `aiAgentId`, `aiStatus`, `aiStartedAt`, `aiCompletedAt`, `aiError`, `aiProgress` to queries
- Kanban cards and All Work view now display AI status badges correctly

### 12. Work Detail Page Improvements

**Location:** `src/app/dashboard/work/[id]/page.tsx`

- Description now renders as markdown using `MarkdownPreview`
- Added "View AI Output" button linking to `/dashboard/work/{id}/ai-output`
- External links in AI output now open in new tabs (target="_blank")

### 13. Delete Work with Alert Dialog

**Location:** `src/components/work/work-detail-actions.tsx`

- Replaced native `confirm()` with Shadcn's `AlertDialog` component
- Shows proper confirmation modal with Cancel/Delete buttons

### 14. Run AI Button on Work Detail

**Location:** `src/components/work/work-detail-actions.tsx`

- Added "Run AI" button that triggers AI execution
- Only shows when work has an `aiAgentId` assigned and AI is not already running

### 15. Agent Management

**Locations:**
- `src/components/agents/agent-list.tsx` - Agent list UI
- `src/app/api/agents/route.ts` - Agent CRUD API
- `src/app/dashboard/agents/[id]/page.tsx` - Agent detail page

#### Create Agent Dialog
- Uses Shadcn's `Select` for work type selection
- Options: Task, Research, Code, Document, Communication, Meeting
- Textarea for System Prompt (rules/instructions)
- Agent type defaults to "ai"

#### Delete Agent with Alert Dialog
- Uses Shadcn's `AlertDialog` for confirmation
- Shows agent name in confirmation message

#### Agent Rules Display
- Agent detail page shows configured system prompt/rules
- Stored in `agent.config.systemPrompt`

### 16. AI Execution Stage Progression

**Locations:**
- `src/actions/work/create.ts`
- `src/actions/work/assign-agent.ts`
- `src/app/api/agents/[agentId]/route.ts`

Stage flow:
- `new` → `triaged` (AI starts)
- `triaged` → `awaiting_review` (AI completes successfully)
- `triaged` → `blocked` (AI fails)

---

## Database Changes

### New Fields

**work table:**
- `aiCustomInstructions` - Custom rules for AI execution

**Generated migration:** `drizzle/migrations/0019_bright_quasar.sql`

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon (Postgres) + pgvector
- **ORM:** Drizzle
- **Auth:** Better Auth (magic link/OTP)
- **UI:** Shadcn + Tailwind v4
- **Runtime:** Bun
- **AI:** OpenRouter API

---

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```
   OPENROUTER_API_KEY=your_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=your_neon_url
   ```

3. Generate and run migrations:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

4. Start development server:
   ```bash
   bun run dev
   ```

---

## Project Structure

```
src/
├── actions/          # Server actions
│   ├── work/        # Work CRUD operations
│   ├── agents/      # Agent management
│   └── auth/        # Authentication
├── app/             # Next.js pages
│   ├── api/         # API routes
│   └── dashboard/  # Dashboard pages
├── components/      # React components
│   ├── ui/          # Shadcn components
│   ├── work/        # Work-related components
│   ├── kanban/      # Kanban board components
│   └── agents/      # Agent components
├── db/             # Database
│   └── schema/      # Drizzle schemas
└── lib/            # Utilities
    ├── ai-execute.ts    # AI execution
    ├── ai-triage.ts     # AI triage/analysis
    └── embeddings.ts   # Semantic search
```

---

## License

MIT