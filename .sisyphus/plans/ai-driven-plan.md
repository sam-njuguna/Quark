# AI-Driven Quark Platform Plan

## Vision
Transform Quark into an AI-first work management platform where AI agents autonomously drive work forward, with intelligent UI that adapts to AI workflows.

---

## REMOVE (Manual Things to Remove)

### UI Controls to Remove
- ❌ **WorkDetailSheet**: Assignment dropdown (AI assigns itself)
- ❌ **WorkDetailSheet**: Manual stage selector (AI auto-advances)
- ❌ **KanbanCard**: "Start Work" button (AI auto-starts)
- ❌ **KanbanCard**: Manual priority selector
- ❌ **KanbanColumn**: "Move to stage" buttons (AI handles)
- ❌ **KanbanCard**: Manual "Claim" button

### Concepts to Deprecate
- ❌ "Assigned To" human-only dropdown
- ❌ Manual stage progression
- ❌ Manual priority assignment
- ❌ "Claimed by" concept

---

## ADD (AI Things to Add)

### Automation (Backend)
- ✅ **AI Auto-Triage**: On work creation, AI analyzes description → sets type, priority
- ✅ **AI Auto-Assign**: AI assigns to best agent (human or AI) based on skills/workload
- ✅ **AI Auto-Stage Progression**: new → triaged → in_progress → awaiting_review → done
- ✅ **AI Quality Gate**: AI checks output before marking done
- ✅ **AI Auto-Start**: AI starts when work is assigned to it
- ✅ **AI Escalation**: AI requests human help when blocked

### UI Components (Frontend)
- ✅ **AI Activity Feed**: Real-time dashboard section showing AI working
- ✅ **AI Status Badge**: thinking | working | completed | blocked
- ✅ **AI Agent Avatar**: Bot avatar on cards when AI assigned
- ✅ **AI Streaming Indicator**: Animated indicator when AI is working
- ✅ **AI Suggestions Panel**: AI recommends next actions

### Enhanced Components
- ✅ **WorkDetailSheet**: Remove manual controls, show AI progress instead
- ✅ **KanbanCard**: Show AI status badge, AI agent name, streaming indicator
- ✅ **Dashboard**: AI stats section, active AI work list

---

## Implementation Phases

### Phase 1: Remove Manual Controls (This Week)

#### 1.1 Remove WorkDetailSheet Manual Controls
- [ ] Remove assignment dropdown (show AI status instead)
- [ ] Remove stage selector dropdown
- [ ] Keep: description, instructions, success criteria, comments

#### 1.2 Remove Kanban Manual Controls  
- [ ] Remove "Start Work" buttons from cards
- [ ] Remove manual stage change buttons from columns

#### 1.3 Remove Manual Actions
- [ ] Remove manual "Approve/Reject" (AI self-approves or requests review)
- [ ] Remove manual "Block" (AI auto-blocks and escalates)

---

### Phase 2: Add AI Automation (Week 2)

#### 2.1 AI Auto-Triage
- [ ] On work creation, call AI to analyze
- [ ] AI sets: type, priority, suggested agent
- [ ] Returns triaged work item

#### 2.2 AI Auto-Stage
- [ ] When AI assigned → auto-move to "triaged"
- [ ] When AI starts working → auto-move to "in_progress"
- [ ] When AI submits output → auto-move to "awaiting_review"
- [ ] After quality check pass → auto-move to "done"

#### 2.3 AI Auto-Assignment
- [ ] AI analyzes work → picks best agent
- [ ] Considers: agent skills, current workload, work type

---

### Phase 3: Add AI-First UI (Week 3)

#### 3.1 Dashboard AI Section
- [ ] AI Activity feed component
- [ ] AI work stats (completed, in-progress, queued)
- [ ] AI completion metrics

#### 3.2 Kanban AI Updates
- [ ] AI status badge on cards
- [ ] AI agent avatar (bot icon + name)
- [ ] Streaming animation when AI working

#### 3.3 Work Detail AI Updates
- [ ] AI Progress Viewer (already exists - enhance)
- [ ] Remove manual stage controls (show auto-progress)
- [ ] Show AI thinking in real-time

---

### Phase 4: AI Intelligence (Week 4)

#### 4.1 AI Work Creation
- [ ] Natural language input → AI creates work
- [ ] AI generates description from vague prompts

#### 4.2 AI Suggestions
- [ ] AI suggests next work to focus on
- [ ] AI predicts blockers

#### 4.3 AI Escalation
- [ ] AI detects blocked → requests human help
- [ ] AI notifies with context

---

## Files to Modify

### High Priority (This Week)
| File | Change |
|------|--------|
| `src/components/work/work-detail-sheet.tsx` | Remove assignment dropdown, stage selector |
| `src/components/kanban/kanban-card.tsx` | Remove start button, add AI status |
| `src/components/kanban/kanban-column.tsx` | Remove stage buttons |
| `src/actions/work/create.ts` | Add AI auto-triage |
| `src/lib/ai-execute.ts` | Add auto-stage logic |

### Medium Priority (Week 2)
| File | Change |
|------|--------|
| `src/app/dashboard/page.tsx` | Add AI activity feed |
| `src/components/ui/` | Add AI status badge component |
| `src/actions/work/assign.ts` | Deprecate (AI auto-assigns) |

---

## Priority Order

1. **Remove** manual assignment dropdown from WorkDetailSheet
2. **Remove** manual stage selector from WorkDetailSheet  
3. **Remove** "Start Work" button from KanbanCard
4. **Add** AI auto-triage on work creation
5. **Add** AI status badge to KanbanCard
6. **Add** AI activity feed to dashboard
