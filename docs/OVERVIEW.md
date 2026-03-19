# Quark - Multi-Agent Task Orchestration

> The shared workspace where humans collaborate through their AI agents. No copy-paste. No silos. Just work flowing between people through their AIs.

---

## Project Overview

**What is Quark?**

A shared workspace where humans collaborate through their AI agents. You tell your IDE (Windsurf, Cursor, Claude) to push work. Someone else pulls it with their IDE. Everyone sees what's happening. All trackable, all reviewable.

Think of it as **a collaboration hub for AI-connected humans** — not just "AI does tasks for me" but "my AI works with your AI on shared work."

**The core insight:** Remove the human as the integration layer. Agents talk to the same DB. Humans direct and approve.

---

## The Core Idea

```
Human A tells their AI (via IDE/MCP): "Push this work to Quark"
                ↓
        Work saved to shared DB
                ↓
Human B pulls with their AI: "What work is there for me?"
                ↓
        Human B's AI does the work, submits
                ↓
Human A reviews, approves/rejects, or passes to someone else
```

**The magic:** Humans don't need to be online at the same time. They just tell their AI assistants what to do, and Quark keeps everything organized.

---

## The Problem You're Solving

Right now, when people collaborate using AI tools, the context lives in silos. Alex has a conversation with his Claude. Sam has a conversation with her GPT. They're solving the same problem but their AIs know nothing about each other. So humans end up being the copy-paste layer — pasting Claude's output into a Slack message, then Sam pastes that into her AI, then emails the result back.

**The human becomes the integration.** That's the problem.

Quark removes that. Agents talk to the same DB, so no human has to carry context between AI sessions. The agents are already synced. Humans just direct and approve.

The second problem is AI output sprawl. Every chat with an AI generates walls of text. Most of it is noise. Nobody saves what matters. Decisions get lost. Actions don't get tracked. Quark solves that by making it intentional — a human explicitly tells their agent what to preserve, and only that gets saved.

---

## Competitive Landscape

| Platform | What it does | Gap |
|----------|--------------|-----|
| **Linear + AI** | Task management with AI | One team, one AI, no agent-to-agent handoff |
| **Notion AI** | AI inside docs | No protocol for agents talking across people |
| **MultiOn, AutoGen, CrewAI** | Agent orchestration | Developer tools, no human-in-the-loop chat, no clean DB saving |
| **Slack + AI bots** | Bot-based AI | Each bot isolated, no shared memory, no task ownership |
| **Quark** | Human-first, chat-native workspace | Agents share DB via MCP, humans control what gets saved, approval-to-archive loop |

**What nobody has built** — a human-first, chat-native workspace where each person has their own agent, agents share a DB through MCP, humans stay in control of what gets saved, and there's a clean approval-to-archive loop.

---

## What Quark Can Manage

The work type is defined by the human via their AI/IDE. Whatever you can describe, your AI can push to Quark:

| Work Type | Example |
|-----------|---------|
| **Tasks** | "Review this PR and push the findings to Quark" |
| **Meetings** | "Check everyone's calendar availability and schedule this meeting" |
| **Research** | "Gather info on X, pass it to Human B when done" |
| **Code** | "Check if code was pushed to repo, if yes push summary to Quark" |
| **Communications** | "Draft this email, push to Quark for my review" |
| **Data** | "Run this query, summarize results in Quark" |
| **Reviews** | "Review this document, push feedback to Quark" |

**The pattern:** Human tells their AI what to do → AI pushes result to Quark → Next human pulls, works, pushes back → Everyone sees history.

It's driven by **human intent**, expressed through their AI assistant.

---

## Vision

**The operating system for human-to-human collaboration via AI assistants.**

- Humans don't need to be online together
- They just tell their AI what to do
- Work moves between humans through their AI agents
- Everything tracked, nothing lost

Not "AI works for humans." It's **humans collaborating through their AI assistants**, with Quark as the shared backbone.

| Issue | What happens now | What Quark does |
|-------|------------------|------------------|
| Work lives everywhere | Tasks in Slack, Notion, Linear | Single DB for everything |
| No visibility | "What's everyone working on?" | Dashboard shows assigned tasks |
| Agent isolation | Agent can't access shared tasks | MCP connects IDE to DB |
| Disconnected flow | Create here, work there, review elsewhere | One flow: IDE ↔ DB ↔ Dashboard |

**Core insight:** Give AI agents a shared database to poll from. No need for them to know about each other.

---

## How Quark Works

### The Visibility Model

**What each role sees:**

| Role | Sees | Doesn't See |
|------|------|-------------|
| Task Creator | Tasks they created | Other user's private tasks |
| Assigned User | Tasks assigned to them | Team tasks not assigned to them |
| Team Lead | All team tasks | Other team's tasks |
| Agent | Tasks they can claim | Tasks already claimed by others |

**Key principle:** A user assigned to a task sees it in "My Tasks". They don't see other team tasks unless they're also assigned or the team lead.

### What's Unique

1. **Humans collaborate via their AI** - Not "AI does tasks" but "my AI talks to your AI"
2. **Async by default** - Humans don't need to be online together
3. **Full audit trail** - Who did what, when, what happened
4. **Any work type** - Whatever you can describe to your AI, it can push to Quark

---

## Core Features

| Feature | Description |
|---------|-------------|
| **IDE-First** | Work entirely from Windsurf, Cursor, Claude via MCP |
| **Shared Inbox** | Single place for all delegated work |
| **Visibility** | See only your work, team leads see team work |
| **Race-Free** | Atomic claiming prevents duplicate work |
| **Full History** | Every action tracked, who did what, when |
| **Notifications** | Alerts at every step (email, in-app) |
| **Multi-Work Types** | Tasks, meetings, research, code, documents... |
| **Reassign** | Pass work to someone else at any stage |
| **Block/Unblock** | Mark work as blocked with reason |

### Additional Features (Brainstorming)

**Search & Filters:**
- Search by title, type, assignee, creator
- Filter by stage, priority, date range
- Save filter presets

**Bulk Actions:**
- Select multiple items, move to stage
- Assign to someone, change priority
- Cancel multiple

**Templates:**
- Pre-defined work types with default fields
- "Quick create" for common patterns

**Recurring Work:**
- Schedule daily/weekly/monthly tasks
- AI creates new work from template automatically

**Analytics (for team leads):**
- Work throughput by stage
- Average time in each stage
- Who has too much/too little assigned
- Blocked work count

**Permissions:**
- Member: See/own own work only
- Lead: See all team work, reassign, manage
- Admin: Manage team, integrations, settings

---

## Work Structure

When creating work (via Dashboard or AI/MCP), what fields?

```
┌─────────────────────────────────────────────────────┐
│  CREATE WORK                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Title: [________________________]                 │
│  Type: [Task ▼] (or Meeting, Research, Code, etc.) │
│  Description: [_______________________]            │
│           (rich text, markdown supported)          │
│                                                     │
│  Assign to: [User ▼]  or  [Open / Anyone]         │
│  Priority: [P1 ▼] (P1, P2, P3)                    │
│  Due date: [Optional]                              │
│  Tags: [tag1] [tag2] [+Add]                        │
│                                                     │
│  Context/Instructions:                             │
│  [What you want the AI to do, context, links...]  │
│                                                     │
│  Success criteria (optional):                     │
│  [What "done" looks like]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Fields explained:**

| Field | Purpose |
|-------|---------|
| Title | Short name for the work |
| Type | Categorizes work for filtering/analytics |
| Description | Full details, links, background |
| Assign | Specific person OR open for anyone |
| Priority | P1 (urgent) to P3 (low) |
| Due date | Optional deadline |
| Tags | Additional categorization |
| Context/Instructions | What the AI should do - this is key! |
| Success criteria | How to know it's done (for auto-approval) |

**The "Context/Instructions" field is critical** - this is how humans tell their AI what to do. The more detail, the better the AI can execute.

---

## How Humans Use Quark via Their AI

Since Quark is accessed via MCP, humans interact through their IDE's AI assistant:

**Example prompts humans might use:**

```
"Push a new task to Quark: Review PR #123, the context is in Slack"
↓
AI creates work in Quark, assigns to Human B

"What work do I have in Quark?"
↓
AI fetches user's assigned work from Quark

"Take the first task in Quark, do the work, and submit it"
↓
AI claims work, does it based on instructions, submits

"What's the status of the research task I created yesterday?"
↓
AI fetches work details and status from Quark

"Reassign my Quark tasks to Sarah"
↓
AI updates assignees in Quark

"Block the code review task, reason: waiting on CI"
↓
AI adds block with reason
```

**The pattern:** Human speaks naturally → AI interprets → MCP calls Quark → Result returned to human.

This means **no learning curve** - just talk to your AI normally.

---

## Future Possibilities

Driven by what humans tell their AI to do via MCP:

- **Smart Scheduling** - AI checks calendar availability, proposes meeting times
- **Research Handoffs** - "Research X, pass to Human B when done" - both see progress
- **Code Integration** - AI checks if code was pushed, triggers review workflow
- **Document Pipeline** - AI drafts, passes to human for review, publishes
- **Status Monitoring** - AI checks systems, pushes alerts to Quark for human decision
- **Cross-team Collaboration** - Human A's AI works with Human B's AI on shared work

### Required Integrations

To enable the above, Quark needs to connect to external platforms:

| Work Type | Integration Needed | What It Enables |
|-----------|-------------------|-----------------|
| **Meetings** | Google Calendar, Outlook, Cal.com API | Check availability, schedule meetings |
| **Code** | GitHub, GitLab, Bitbucket API | Check pushes, trigger reviews, get PR status |
| **Documents** | Google Docs, Notion, Confluence API | Read/write documents, track changes |
| **Communication** | Slack, Discord, Email (SendGrid/Resend) | Send notifications, trigger alerts |
| **Data** | Database connections, BI tools | Run queries, pull reports |
| **Project Mgmt** | Linear, Asana, Jira API | Sync tasks, update status |

**The pattern:** Human tells AI → AI calls external API → Result pushed to Quark → Next human reviews.

---

## Dashboard

### Kanban Stages

```
┌─────────────┬─────────────┬──────────────┬───────────┬──────────────┬──────────┬────────────┐
│   NEW       │  TRIAGED   │ IN PROGRESS │ AWAITING  │   REVISION   │ BLOCKED  │   DONE    │
│             │            │              │  REVIEW   │              │          │            │
│ - Just      │ - Categoriz │ - Claimed    │ - Submitted│ - Changes    │ - Needs  │ - Approved │
│   created   │ - Assigned  │ - Working   │ - Waiting │   requested  │   help   │            │
│ - Not yet   │ - Priority │ - Using AI  │ - Reviewer│ - Agent      │ - Stuck  │ - Final   │
│   reviewed  │   set       │              │   notified│   continues  │ - Waiting│  output    │
└─────────────┴─────────────┴──────────────┴───────────┴──────────────┴──────────┴────────────┘
              │
              ▼
         ┌──────────┐
         │CANCELLED │
         │          │
         │ - Stopped│
         │ - Rejected│
         │ - No go  │
         └──────────┘
```

**Flow options:**

- **Happy path:** New → Triaged → In Progress → Awaiting Review → Done
- **With revisions:** New → Triaged → In Progress → Awaiting Review → Revision → Awaiting Review → Done
- **With blocks:** New → Triaged → In Progress → Blocked → In Progress → ...
- **Reassign:** At any stage, can reassign to someone else (goes to their Triaged)
- **Cancelled:** New → Triaged → Cancelled (at any stage)

### Additional Ideas

**Per-Work-Type Views:**

```
┌─────────────────────────────────────────────────────────────┐
│  TABS:  All  │  Tasks  │  Meetings  │  Research  │  Code   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Kanban columns could filter by work type                  │
│  Or separate boards per type                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Quick Actions (for humans via AI or Dashboard):**

- Move to next stage
- Reassign to someone else
- Add note/comment
- Block/unblock with reason
- Cancel with reason
- Request revision

**Work Cards Show:**

- Title + Type (task/meeting/research)
- Who it's assigned to
- Who created it
- Priority (P1, P2, P3)
- Time in current stage
- Last update timestamp
- Quick actions

### Notifications

| Trigger | Who gets notified | Channel |
|---------|-------------------|---------|
| Work created (assigned to you) | Assignee | Email + in-app |
| Work submitted for review | Creator | Email + in-app |
| Revision requested | Assignee | Email + in-app |
| Work approved | Creator + Assignee | Email |
| Work blocked | Creator | In-app |
| Work reassigned | New assignee | Email + in-app |
| Work cancelled | Creator | In-app |
| @Mention in comment | Mentioned user | Email + in-app |

**User preferences:**
- Choose notification channels per event type
- Daily digest option instead of instant
- Mute notifications for specific work

### Mobile Experience

- Responsive Kanban (swipe to move between columns)
- Quick create from mobile
- Push notifications for important events
- View-only on mobile (full dashboard on desktop)

### Views

- **Kanban Board** - Drag cards across columns
- **List View** - Table with sorting, filtering
- **Calendar** - Timeline view for scheduled work
- **Activity Feed** - Everything happening in the team
- **My Work** - Just your assigned work (default view)

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  QUARK                                    [User] [Settings]  │
├──────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MY WORK (5)  │  TEAM (12)  │  ALL (45)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [New Work ▼]  [Filter ▼]  [Search...]                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              KANBAN BOARD                           │    │
│  │                                                      │    │
│  │  NEW   TRIAGED  IN PROG  AWAIT  REV  BLOCK  DONE   │    │
│  │  ───   ───────  ──────  ─────  ────  ─────  ────   │    │
│  │                                                      │    │
│  │  [Card] [Card]  [Card]  [Card]       [Card]        │    │
│  │  [Card]        [Card]  [Card]              [Card]  │    │
│  │               [Card]                              │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└──────────────────────────────────────────────────────────────┘
```

**Default view** shows "My Work" - user sees only their assigned items. Can switch to Team or All views.

---

## Organization Structure

**Brainstorming:**

```
┌─────────────────────────────────────────────────────────┐
│                     ORGANIZATION                        │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   TEAM A    │  │   TEAM B    │  │   TEAM C    │   │
│  │             │  │             │  │             │   │
│  │ - Members   │  │ - Members   │  │ - Members   │   │
│  │ - Work      │  │ - Work      │  │ - Work      │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│         │                │                │             │
│         ▼                ▼                ▼             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              SHARED WORKSPACE                   │   │
│  │  (Teams can share work with each other)        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Ideas:**
- Users belong to teams
- Teams have leads and members
- Cross-team work sharing (Team A can assign to Team B)
- Organization-level visibility for admins

---

## API & Webhooks

For external integrations:

**Quark exposes:**
- REST API for CRUD operations
- Webhooks for events (work created, stage changed, etc.)
- MCP for AI/IDE integration

**Webhook events:**
- `work.created`
- `work.stage_changed`
- `work.assigned`
- `work.completed`
- `work.blocked`
- `work.cancelled`

---

## Support

- Discord: https://discord.gg/quark