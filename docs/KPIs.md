# Quark - KPIs & Metrics

## Overview

Track the health and efficiency of work flowing through Quark.

## Team-Level KPIs

### Work Volume

| KPI | Description | Formula | Target |
|-----|-------------|---------|--------|
| **Total Work Created** | Number of work items created | COUNT(work.createdAt) | - |
| **Work Completed** | Number of work items in "done" | COUNT(work.stage = 'done') | - |
| **Completion Rate** | % of created work that's done | completed / created × 100 | > 80% |
| **Active Work** | Current in-progress + awaiting review | COUNT(stage IN ('in_progress', 'awaiting_review', 'revision')) | - |

### Cycle Time

| KPI | Description | Formula | Target |
|-----|-------------|---------|--------|
| **Avg Cycle Time** | Days from creation to done | AVG(completedAt - createdAt) | < 3 days |
| **Avg Time in Stage** | Average days per stage | Per stage breakdown | < 1 day per stage |
| **Time to First Action** | Days from created to first stage change | AVG(firstStageChangeAt - createdAt) | < 1 day |
| **Time to Submit** | Days from triaged to awaiting review | AVG(submittedAt - triagedAt) | < 1 day |

### Stage Metrics

| Stage | KPI | Formula |
|-------|-----|---------|
| **New** | Items sitting in New | COUNT(stage = 'new' AND createdAt < NOW() - INTERVAL '1 day') | < 5 |
| **Blocked** | Blocked items | COUNT(stage = 'blocked') | < 10% of active |
| **Awaiting Review** | Items waiting | COUNT(stage = 'awaiting_review') | < 20 |
| **Revision** | Items in revision | COUNT(stage = 'revision') | < 10 |

### Quality

| KPI | Description | Formula | Target |
|-----|-------------|---------|--------|
| **Revision Rate** | % needing revision | revisions / submissions × 100 | < 30% |
| **First-Pass Rate** | % approved without revision | first_approve / total_approve × 100 | > 50% |
| **Cancel Rate** | % cancelled | cancelled / created × 100 | < 10% |

### Team Health

| KPI | Description | Formula | Target |
|-----|-------------|---------|--------|
| **Workload Distribution** | Standard deviation of assigned work | STDDEV(assignedCount) per user | < 2 |
| **Blocked Work Age** | Avg days blocked | AVG(NOW() - blockedAt) | < 2 days |
| **Unassigned Work** | Items without assignee | COUNT(assignedTo IS NULL AND stage != 'done') | < 5 |

## User-Level KPIs

### Individual Performance

| KPI | Description | Formula |
|-----|-------------|---------|
| **Work Owned** | Items assigned to user | COUNT(assignedTo = userId) |
| **Work Completed** | Items user completed | COUNT(assignedTo = userId AND stage = 'done') |
| **Avg Completion Time** | User's avg cycle time | AVG(completedAt - createdAt) WHERE assignedTo = userId |
| **Submission Rate** | Submissions per day | COUNT(submittedAt) / days active |

### Collaboration

| KPI | Description | Formula |
|-----|-------------|---------|
| **Reviews Given** | Times user reviewed others' work | COUNT(approvedBy = userId OR rejectedBy = userId) |
| **Feedback Quality** | Avg feedback length (proxy) | AVG(LENGTH(rejectionFeedback)) |
| **Quick Review Time** | Avg hours to first review | AVG(reviewedAt - submittedAt) |

## Work Type KPIs

Track metrics per work type (task, meeting, research, code, etc.):

| KPI | Description |
|-----|-------------|
| **Volume by Type** | COUNT per type |
| **Completion Rate by Type** | done / created per type |
| **Avg Cycle Time by Type** | AVG(completedAt - createdAt) per type |
| **Revision Rate by Type** | revisions / submissions per type |

## Dashboard Views

### Team Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  TEAM METRICS - Last 30 Days                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Created: 45    Completed: 38    Completion Rate: 84%        │
│                                                              │
│  Avg Cycle Time: 2.1 days    First Pass Rate: 67%          │
│                                                              │
│  BLOCKED: 3    AWAITING REVIEW: 5    IN REVISION: 2       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CYCLE TIME TREND                                    │   │
│  │  ████████████████████████░░░░  2.1 days avg         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Kanban Health

```
┌──────────────────────────────────────────────────────────────┐
│  KANBAN HEALTH CHECK                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  NEW        │ ⚠️ 12 items > 1 day old     │ Target: < 5   │
│  BLOCKED    │ ❌ 3 items blocked > 2 days  │ Target: < 2   │
│  AWAITING   │ ⚠️ 8 items waiting > 1 day  │ Target: < 20  │
│  REVISION   │ ✓ 2 items in revision       │ Target: < 10  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Team Workload

```
┌──────────────────────────────────────────────────────────────┐
│  WORKLOAD DISTRIBUTION                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Sarah  ████████████████ 8 items  ✓ Balanced                │
│  Alex   ██████████████░░░░ 6 items  ✓ Balanced              │
│  Peter  ██████████████████ 10 items ⚠️ Heavy                │
│  Sam    ██████████░░░░░░░░░ 4 items ✓ Light                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## SQL Queries

### Completion Rate

```sql
SELECT 
  COUNT(*) FILTER (WHERE stage = 'done') as completed,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (WHERE stage = 'done')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
  1) as completion_rate
FROM work
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Avg Cycle Time

```sql
SELECT 
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400), 1) as avg_days
FROM work
WHERE stage = 'done'
  AND completed_at >= NOW() - INTERVAL '30 days';
```

### Stage Distribution

```sql
SELECT 
  stage,
  COUNT(*) as count
FROM work
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'new' THEN 1
    WHEN 'triaged' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'awaiting_review' THEN 4
    WHEN 'revision' THEN 5
    WHEN 'blocked' THEN 6
    WHEN 'done' THEN 7
    WHEN 'cancelled' THEN 8
  END;
```

### Blocked Work

```sql
SELECT 
  id,
  title,
  blocked_reason,
  assigned_to,
  NOW() - updated_at as blocked_duration
FROM work
WHERE stage = 'blocked'
ORDER BY updated_at ASC;
```

### User Workload

```sql
SELECT 
  u.name,
  u.email,
  COUNT(w.id) FILTER (WHERE w.stage != 'done') as active_work,
  COUNT(w.id) FILTER (WHERE w.stage = 'done') as completed
FROM users u
LEFT JOIN work w ON w.assigned_to = u.id
GROUP BY u.id, u.name, u.email
ORDER BY active_work DESC;
```

## Alert Thresholds

Set up alerts when:

| Metric | Warning | Critical |
|--------|---------|----------|
| Blocked work age | > 2 days | > 5 days |
| Items in New > 1 day | > 10 | > 20 |
| Revision rate | > 40% | > 60% |
| Completion rate | < 70% | < 50% |
| Avg cycle time | > 5 days | > 10 days |
| User workload stddev | > 3 | > 5 |
