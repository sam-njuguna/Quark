# Quark Application Guide

## Overview

Quark is a multi-agent orchestration platform where humans collaborate through their AI agents. It provides work management, team collaboration, and sprint planning capabilities.

---

## Core Concepts

### Work Items

Work is the central entity in Quark. Each work item has:

| Property | Description |
|----------|-------------|
| **Title** | Brief description of the work |
| **Type** | `task`, `meeting`, `research`, `code`, `document`, `communication` |
| **Stage** | Current status in the workflow |
| **Priority** | P1 (High), P2 (Medium), P3 (Low) |
| **Assignee** | User responsible for the work |
| **Team** | Team that owns the work |
| **Due Date** | When the work should be completed |

### Work Stages

Work flows through these stages:

```
new → triaged → in_progress → awaiting_review → done
                    ↓              ↓
                blocked ←── revision
```

| Stage | Description |
|-------|-------------|
| **new** | Fresh work, not yet reviewed |
| **triaged** | Reviewed and ready to start |
| **in_progress** | Currently being worked on |
| **awaiting_review** | Submitted for review |
| **revision** | Needs changes after review |
| **blocked** | Cannot proceed due to dependency |
| **done** | Completed successfully |
| **cancelled** | Cancelled |

---

## User Roles

### System Roles

| Role | Permissions |
|------|-------------|
| **user** | Standard team member access |
| **super_admin** | Full access to all teams and features |

### Team Roles

| Role | Can Do |
|------|--------|
| **member** | View team work, assign themselves, update own work |
| **lead** | All member permissions + assign others, manage sprints |
| **admin** | All lead permissions + manage team settings, invite members |

---

## Access Control

### Work Visibility

| Location | Who Can See |
|----------|-------------|
| **My Work** (`/dashboard`) | Only work assigned to you |
| **All Work** (`/dashboard/all`) | Work from your teams (super admin sees all) |
| **Team** (`/dashboard/team`) | Work from your active team |

### Work Assignment

| Your Role | Can Assign To |
|-----------|--------------|
| **Member** | Only yourself |
| **Lead** | Any team member |
| **Team Admin** | Any team member |
| **Super Admin** | Anyone |

### Kanban Card Movement

| Work Status | Who Can Drag |
|-------------|--------------|
| **Assigned to you** | ✅ You can drag |
| **Assigned to others** | ❌ Cannot drag |
| **Unassigned** | ❌ Cannot drag (assign yourself first) |

---

## Key Workflows

### 1. Picking Up Unassigned Work

1. Navigate to **All Work** or **Team** page
2. Find an unassigned work item (shows "Unassigned — click to assign yourself")
3. Click the card to open the detail sheet
4. Click **"Assign yourself"** button
5. Now you can drag the card through the workflow

### 2. Creating New Work

1. Click **"New Work"** button in sidebar or use **+** button on Kanban columns
2. Fill in title, type, team, and optional fields
3. Work starts in **new** stage
4. A lead/admin can triage and assign it

### 3. Moving Work Through Stages

**As the assignee:**
1. Drag your card to the next stage
2. Or use the right-click context menu for quick actions

**Stage transitions:**
- `new` → `triaged` (by lead/admin)
- `triaged` → `in_progress` (start working)
- `in_progress` → `awaiting_review` (submit for review)
- `awaiting_review` → `done` (approved) or `revision` (needs changes)
- `revision` → `awaiting_review` (resubmit)
- Any stage → `blocked` (if stuck)

### 4. Reviewing Work

**As a lead/admin:**
1. Find work in **awaiting_review** stage
2. Open the detail sheet
3. Review the submitted output
4. Either:
   - Click **Approve** → moves to `done`
   - Click **Request Revision** → moves to `revision` with feedback

### 5. Managing Sprints

**Sprint permissions:**
- **Members**: Can view sprints but not create/manage
- **Leads/Admins**: Can create, start, complete, and delete sprints

**Creating a sprint:**
1. Go to **Team** page
2. In Sprints section, click **"New Sprint"**
3. Set name, start date, end date, and optional goal
4. Sprint starts in "planning" state

**Starting a sprint:**
1. Click **Start** on a planning sprint
2. Only one sprint can be active at a time

---

## Features

### Kanban Board

- Drag-and-drop interface for work management
- Color-coded priority indicators (red=high, amber=medium)
- Type badges for quick identification
- Due date indicators with overdue highlighting
- Context menu for quick actions
- Virtualized scrolling for large lists

### Work Detail Sheet

- Full work details and metadata
- **Assignee selection** with role-based filtering
- **Stage transitions** with validation
- **Comments** for collaboration
- **Attachments** for files
- **Outputs** for deliverables
- **Activity log** showing recent changes

### Calendar View

- Monthly calendar with work items
- Sprint overlays showing active iterations
- Drag to create new work on specific dates

### Activity Feed

- Shows recent activity from your teams
- Filters out cross-team noise for members

### Settings

- **Profile**: Update your info and availability
- **Teams**: View teams, manage members (lead/admin)
- **MCP Setup**: Configure AI agent connections
- **Webhooks**: Set up event notifications
- **Recurring Work**: Create recurring work templates

---

## Navigation

| Route | Description |
|-------|-------------|
| `/dashboard` | My Work - Kanban board of your assigned work |
| `/dashboard/all` | All Work - All work from your teams |
| `/dashboard/team` | Team - Analytics, sprints, and team board |
| `/dashboard/calendar` | Calendar - Monthly view with sprints |
| `/dashboard/new` | Create new work |
| `/dashboard/work/[id]` | Work detail page |
| `/dashboard/settings` | Settings and configuration |
| `/dashboard/integrations` | External integrations |

---

## Tips

### For Members
- Check **All Work** regularly for unassigned items you can pick up
- Use the **"Assign yourself"** button on unassigned work
- Only drag cards that are assigned to you
- Add comments to keep others informed of progress

### For Leads
- Triage new work promptly (new → triaged)
- Assign work to appropriate team members
- Review submitted work in a timely manner
- Use **Auto-assign** for quick load balancing

### For Admins
- Monitor team workload distribution
- Set up webhooks for external notifications
- Manage team membership and invitations
- Configure tool policies for AI agents

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Esc` | Close sheets/dialogs |

---

## API & Integrations

### MCP (Model Context Protocol)

Connect AI agents to Quark:
1. Go to **Settings → MCP Setup**
2. Copy your API key
3. Configure your MCP client with the provided config

### Webhooks

Set up webhooks for external notifications:
1. Go to **Settings → Webhooks**
2. Add webhook URL and select events
3. Verify webhook delivery

---

## Troubleshooting

### "Cannot move card"
- You can only drag cards assigned to you
- If unassigned, open the card and click "Assign yourself" first

### "Cannot transition from X to Y"
- Some stage transitions aren't allowed
- Use the allowed transitions (see Work Stages above)

### "Insufficient permissions"
- Check your role in the team
- Some actions require lead or admin role

### Work not showing up
- Check you're on the right team
- Verify the work is assigned to you (for My Work view)
- For All Work, check your team membership
