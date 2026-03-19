# Quark - Technical Documentation

## Overview

Quark is a multi-agent orchestration platform built with Next.js 16, Neon DB, and MCP (Model Context Protocol) integration.

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 16 | App router, Server Actions |
| Database | Neon (Postgres) | Primary DB with pgvector |
| ORM | Drizzle | Type-safe database operations |
| Auth | Better Auth | Magic link / OTP authentication |
| UI | Shadcn + Tailwind v4 | Dashboard interface |
| Protocol | MCP Handler | AI agent integration |
| Runtime | Bun | Package management |

## Project Structure

```
quark/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # My Work
│   │   │   ├── team/
│   │   │   │   └── page.tsx      # Team view
│   │   │   ├── all/
│   │   │   │   └── page.tsx      # All work (leads)
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── mcp/
│   │   │   │   └── [transport]/
│   │   │   │       └── route.ts   # MCP handler
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── route.ts   # Better Auth
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── actions/
│   │   ├── work/
│   │   │   ├── create.ts
│   │   │   ├── list.ts
│   │   │   ├── get.ts
│   │   │   ├── update-stage.ts
│   │   │   ├── assign.ts
│   │   │   ├── submit.ts
│   │   │   ├── approve.ts
│   │   │   ├── reject.ts
│   │   │   ├── block.ts
│   │   │   └── cancel.ts
│   │   ├── comments/
│   │   │   ├── add.ts
│   │   │   └── list.ts
│   │   ├── auth/
│   │   │   └── session.ts
│   │   └── notifications/
│   │       └── send.ts
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── kanban/
│   │   │   ├── board.tsx
│   │   │   ├── column.tsx
│   │   │   └── card.tsx
│   │   ├── work/
│   │   │   ├── create-form.tsx
│   │   │   ├── detail-view.tsx
│   │   │   └── stage-select.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       └── sidebar.tsx
│   ├── db/
│   │   ├── index.ts              # Drizzle client
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── teams.ts
│   │   │   ├── work.ts           # Main work table
│   │   │   ├── comments.ts
│   │   │   ├── activity.ts
│   │   │   └── integrations.ts
│   │   └── migrations/
│   ├── lib/
│   │   ├── auth.ts               # Better Auth config
│   │   ├── email.ts              # Resend config
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── drizzle/
│   └── migrations/
├── .env.example
├── drizzle.config.ts
├── package.json
└── next.config.ts
```

## Authentication Flow

### Better Auth Setup

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/providers/magic-link";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  magicLink: {
    enabled: true,
    expiresIn: 3600, // 1 hour
  },
});
```

### Proxy Middleware

All routes require authentication via proxy middleware:

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers(headers) {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Require-Auth',
            value: 'true',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Auth Server Actions

```typescript
// src/actions/auth/session.ts
"use server";

import { auth } from "@/lib/auth";
import { cache } from "react";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export const requireUser = async () => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
};

export const requireRole = async (role: "member" | "lead" | "admin") => {
  const user = await requireUser();
  // Check user's role in team
  return user;
};
```

## Database Schema

### Work Table (Core)

```typescript
// src/db/schema/work.ts
import { pgTable, uuid, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const work = pgTable("work", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Work details
  title: text("title").notNull(),
  type: text("type").notNull().default("task"), // task, meeting, research, code, document, communication
  description: text("description"),
  instructions: text("instructions"), // AI instructions
  successCriteria: jsonb("success_criteria"),
  
  // Assignment
  teamId: uuid("team_id").references(() => teams.id),
  createdBy: uuid("created_by").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  claimedBy: text("claimed_by"),
  
  // Stage
  stage: text("stage").notNull().default("new"),
  // new | triaged | in_progress | awaiting_review | revision | blocked | done | cancelled
  
  // Metadata
  priority: integer("priority").default(2), // 1 (high) - 3 (low)
  dueDate: timestamp("due_date"),
  blockedReason: text("blocked_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
});
```

## Server Actions

### Create Work

```typescript
// src/actions/work/create.ts
"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { revalidatePath } from "next/cache";

const createWorkSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["task", "meeting", "research", "code", "document", "communication"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  priority: z.number().min(1).max(3).default(2),
  dueDate: z.string().datetime().optional(),
});

export async function createWork(data: z.infer<typeof createWorkSchema>) {
  const user = await requireUser();
  
  const [newWork] = await db.insert(work).values({
    ...data,
    createdBy: user.id,
    stage: "new",
  }).returning();
  
  // Send notification if assigned
  if (data.assignedTo) {
    await notifyUser(data.assignedTo, "work_assigned", newWork.id);
  }
  
  revalidatePath("/");
  return newWork;
}
```

### Update Stage

```typescript
// src/actions/work/update-stage.ts
"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const stageTransitions: Record<string, string[]> = {
  new: ["triaged", "cancelled"],
  triaged: ["in_progress", "cancelled"],
  in_progress: ["awaiting_review", "blocked", "cancelled"],
  awaiting_review: ["revision", "done", "cancelled"],
  revision: ["awaiting_review", "blocked", "cancelled"],
  blocked: ["in_progress", "cancelled"],
};

export async function updateStage(workId: string, newStage: string, reason?: string) {
  const user = await requireUser();
  
  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  
  if (!currentWork) {
    throw new Error("Work not found");
  }
  
  // Validate transition
  const allowed = stageTransitions[currentWork.stage] || [];
  if (!allowed.includes(newStage)) {
    throw new Error(`Cannot transition from ${currentWork.stage} to ${newStage}`);
  }
  
  // Update
  const updates: Record<string, unknown> = {
    stage: newStage,
    updatedAt: new Date(),
  };
  
  if (newStage === "in_progress") {
    updates.claimedBy = user.id;
  }
  
  if (newStage === "awaiting_review") {
    updates.submittedAt = new Date();
  }
  
  if (newStage === "done") {
    updates.completedAt = new Date();
  }
  
  if (newStage === "blocked") {
    updates.blockedReason = reason;
  }
  
  const [updatedWork] = await db.update(work)
    .set(updates)
    .where(eq(work.id, workId))
    .returning();
  
  // Log activity
  await logActivity(workId, user.id, "stage_changed", {
    from: currentWork.stage,
    to: newStage,
    reason,
  });
  
  // Notify relevant users
  await notifyStageChange(updatedWork, currentWork.stage, newStage);
  
  revalidatePath("/");
  return updatedWork;
}
```

### Assign Work

```typescript
// src/actions/work/assign.ts
"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function assignWork(workId: string, userId: string) {
  const currentUser = await requireUser();
  
  const [updatedWork] = await db.update(work)
    .set({
      assignedTo: userId,
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();
  
  await logActivity(workId, currentUser.id, "assigned", { to: userId });
  await notifyUser(userId, "work_assigned", workId);
  
  revalidatePath("/");
  return updatedWork;
}
```

### Submit Work Output

```typescript
// src/actions/work/submit.ts
"use server";

import { db } from "@/db";
import { work, workOutputs } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitWork(
  workId: string,
  content: Record<string, unknown>,
  contentType: "markdown" | "json" | "files" = "markdown"
) {
  const user = await requireUser();
  
  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  
  if (!currentWork) {
    throw new Error("Work not found");
  }
  
  if (currentWork.claimedBy !== user.id && currentWork.assignedTo !== user.id) {
    throw new Error("Not authorized to submit this work");
  }
  
  // Get latest version
  const [latest] = await db.select()
    .from(workOutputs)
    .where(eq(workOutputs.workId, workId))
    .orderBy(desc(workOutputs.version))
    .limit(1);
  
  const newVersion = (latest?.version || 0) + 1;
  
  // Save output
  await db.insert(workOutputs).values({
    workId,
    content,
    contentType,
    submittedBy: user.id,
    version: newVersion,
  });
  
  // Update work stage
  await db.update(work)
    .set({
      stage: "awaiting_review",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId));
  
  // Notify creator
  if (currentWork.createdBy !== user.id) {
    await notifyUser(currentWork.createdBy, "work_submitted", workId);
  }
  
  await logActivity(workId, user.id, "submitted", { version: newVersion });
  
  revalidatePath("/");
  return { success: true, version: newVersion };
}
```

## MCP Handler

```typescript
// src/app/api/mcp/[transport]/route.ts
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { requireUser } from "@/actions/auth/session";
import { createWork } from "@/actions/work/create";
import { listWork } from "@/actions/work/list";
import { updateStage } from "@/actions/work/update-stage";
import { assignWork } from "@/actions/work/assign";
import { submitWork } from "@/actions/work/submit";

const handler = createMcpHandler((server) => {
  // Create work
  server.tool(
    "create_work",
    "Create a new work item in Quark",
    {
      title: z.string(),
      type: z.enum(["task", "meeting", "research", "code", "document", "communication"]).optional(),
      description: z.string().optional(),
      instructions: z.string().optional(),
      assignedTo: z.string().uuid().optional(),
      priority: z.number().min(1).max(3).optional(),
    },
    async (params) => {
      try {
        const result = await createWork(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // List work
  server.tool(
    "list_work",
    "List work items from Quark",
    {
      stage: z.enum(["new", "triaged", "in_progress", "awaiting_review", "revision", "blocked", "done"]).optional(),
      assignedTo: z.string().uuid().optional(),
      type: z.string().optional(),
      limit: z.number().default(20),
    },
    async (params) => {
      try {
        const results = await listWork(params);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // Update stage
  server.tool(
    "update_work_stage",
    "Move work to a new stage",
    {
      workId: z.string().uuid(),
      stage: z.enum(["triaged", "in_progress", "awaiting_review", "revision", "blocked", "done", "cancelled"]),
      reason: z.string().optional(),
    },
    async (params) => {
      try {
        const result = await updateStage(params.workId, params.stage, params.reason);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // Submit work
  server.tool(
    "submit_work",
    "Submit work output for review",
    {
      workId: z.string().uuid(),
      content: z.record(z.unknown()),
      contentType: z.enum(["markdown", "json", "files"]).default("markdown"),
    },
    async (params) => {
      try {
        const result = await submitWork(params.workId, params.content, params.contentType);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}, { basePath: "/api/mcp" });

export { handler as GET, handler as POST };
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Auth (Better Auth)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=quark@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: External integrations
GITHUB_TOKEN=ghp_xxxxx
CAL_API_KEY=xxxxx
```

## Quick Start

```bash
# Install dependencies
bun install

# Set up database
bun run db:generate
bun run db:migrate

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start development server
bun dev

# Install Shadcn components (if needed)
bunx --bun shadcn@latest init -t next
```

## API Reference

### Server Actions

All server actions require authentication. They throw `Error("Unauthorized")` if not authenticated.

| Action | Parameters | Returns |
|--------|------------|---------|
| `createWork` | `{ title, type?, description?, instructions?, assignedTo?, teamId?, priority?, dueDate? }` | Created work object |
| `listWork` | `{ stage?, assignedTo?, type?, limit? }` | Array of work objects |
| `getWork` | `workId: string` | Work object with outputs and comments |
| `updateStage` | `workId, newStage, reason?` | Updated work object |
| `assignWork` | `workId, userId` | Updated work object |
| `submitWork` | `workId, content, contentType?` | `{ success, version }` |
| `approveWork` | `workId` | Updated work object |
| `rejectWork` | `workId, feedback` | Updated work object |
| `blockWork` | `workId, reason` | Updated work object |
| `cancelWork` | `workId, reason?` | Updated work object |
| `addComment` | `workId, content` | Created comment |
| `listComments` | `workId` | Array of comments |

### MCP Tools

| Tool | Description |
|------|-------------|
| `create_work` | Create a new work item |
| `list_work` | List work items with filters |
| `get_work` | Get work details |
| `update_work_stage` | Move work to new stage |
| `submit_work` | Submit work output |
| `assign_work` | Assign work to user |
| `add_comment` | Add comment to work |
