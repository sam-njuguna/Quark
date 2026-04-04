# AI-Driven Quark Simplification Plan

## Goal
Make Quark fully AI-driven with minimal human intervention. Remove human-centric features, simplify UI, and let AI handle everything.

---

## Routes to REMOVE

### Dashboard Routes (delete these)
| Route | Reason |
|-------|--------|
| `/dashboard/admin` | Human admin panel - not needed |
| `/dashboard/analytics` | Human analytics - AI handles |
| `/dashboard/audit` | Human audit logs - not needed |
| `/dashboard/hierarchy` | Org hierarchy - not needed |
| `/dashboard/calendar` | Calendar view - keep but simplify |

### Keep & Simplify
| Route | Changes |
|-------|---------|
| `/dashboard` | AI activity feed, kanban only |
| `/dashboard/all` | Work list, filter by AI status |
| `/dashboard/settings` | Minimal - only API keys, team name |
| `/dashboard/team` | AI team config (agents per team) |
| `/dashboard/new` | Simplified - description only |

---

## Work Creation Form Changes

### REMOVE from Create Work Form
- ❌ **Type selector** → AI detects type from description
- ❌ **Priority selector** → AI detects priority from description
- ❌ **Instructions field** → AI knows what to do
- ❌ **Success criteria** → AI defines its own
- ❌ **Team selector** → Work belongs to team where created
- ❌ **AssignedTo** → AI assigns to itself

### KEEP in Create Work Form
- ✅ **Title** - what needs to be done
- ✅ **Description** - details (AI analyzes this)
- ✅ **Due date** - deadline for AI (helps track missed deadlines)
- ✅ **Team** - context for AI

---

## Team Changes

### For Each Team, Define AI Agents
Each team should have:
- **Engineering AI Agent** - handles code, PR reviews
- **Research AI Agent** - handles research tasks
- **Communication AI Agent** - handles emails, drafts
- **Documentation AI Agent** - handles docs

### Team Settings Simplify To:
- Team name
- List of AI agents (with API keys)
- Default AI agent for new work

---

## New Work Creation Flow

```
User enters: "Fix the login bug on the homepage"

AI automatically:
1. Analyzes description → detects it's a "code" task
2. Sets priority based on urgency keywords
3. Assigns to appropriate AI agent (e.g., Engineering Agent)
4. Creates work in "new" stage
5. AI agent picks up work → triaged → in_progress → done
```

---

## Implementation Steps

### Step 1: Simplify Create Work Form
- [ ] Remove type selector
- [ ] Remove priority selector  
- [ ] Remove instructions field
- [ ] Remove success criteria
- [ ] Keep: title, description, due date, team

### Step 2: Update Work Schema
- [ ] Make `type` optional (AI will set)
- [ ] Make `priority` optional (AI will set)
- [ ] Remove `instructions` field (not needed)
- [ ] Keep `dueDate` for deadline tracking

### Step 3: Remove Routes
- [ ] Delete `/dashboard/admin`
- [ ] Delete `/dashboard/analytics`  
- [ ] Delete `/dashboard/audit`
- [ ] Delete `/dashboard/hierarchy`

### Step 4: Simplify Team Page
- [ ] Remove member management (no humans to manage)
- [ ] Remove role management
- [ ] Add AI agent configuration per team

### Step 5: Simplify Settings
- [ ] Keep: API keys section
- [ ] Keep: Team name
- [ ] Remove: Most other settings

---

## Files to Modify

### High Priority
| File | Change |
|------|--------|
| `src/components/work/create-work-form.tsx` | Remove type, priority, instructions |
| `src/actions/work/create.ts` | AI auto-detects all fields |
| `src/db/schema/work.ts` | Make type, priority optional |

### Medium Priority
| File | Change |
|------|--------|
| `src/app/dashboard/team/page.tsx` | AI agent config per team |
| `src/app/dashboard/settings/page.tsx` | Minimal settings |
| `src/app/dashboard/analytics/page.tsx` | Delete or make AI-only |
