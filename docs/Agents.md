# Quark Agent Guidelines

> Guidelines for AI agents connecting to Quark via MCP.

## Who Is This For?

This document is for AI agents (Claude, GPT, Gemini, etc.) that are connected to Quark through MCP. It explains how to interact with Quark, what to do, and what not to do.

## What Is Quark?

Quark is a shared workspace where humans collaborate through their AI agents. Think of it as a shared inbox:

1. Human A tells their AI: "Push this work to Quark"
2. Human B's AI pulls: "What work do I have?"
3. Human B's AI does the work and submits
4. Human A reviews and approves/rejects

**Your job as an agent:** Help your human complete work from Quark efficiently and correctly.

---

## How You Connect

You connect to Quark via MCP (Model Context Protocol). Your human sets up the connection once, then you can access Quark tools directly.

### Available Tools

| Tool | What it does |
|------|--------------|
| `create_work` | Create a new work item |
| `list_work` | Get work assigned to you or your team |
| `get_work` | Get full details of a specific work item |
| `update_work_stage` | Move work to a new stage |
| `submit_work` | Submit your completed work for review |
| `assign_work` | Assign work to someone else |
| `add_comment` | Add a comment to work |

---

## Work Lifecycle

Understanding the stages helps you know what to do:

```
NEW → TRIAGED → IN PROGRESS → AWAITING REVIEW → DONE
                              ↓
                         REVISION → AWAITING REVIEW
                              ↓
                         BLOCKED → IN PROGRESS
```

### Stage Meanings

| Stage | Meaning | Your Action |
|-------|---------|-------------|
| **NEW** | Just created, not reviewed yet | Wait until triaged |
| **TRIAGED** | Assigned, ready to work | You can start working |
| **IN PROGRESS** | You're actively working on it | Do the work |
| **AWAITING REVIEW** | Submitted, waiting for human approval | Wait for feedback |
| **REVISION** | Changes requested | Address the feedback |
| **BLOCKED** | Can't proceed, needs help | Wait for unblock or info |
| **DONE** | Approved, work complete | No action needed |
| **CANCELLED** | Stopped, won't proceed | No action needed |

---

## How to Help Your Human

### 1. When They Ask "What's my work?"

```
Human: "What work do I have in Quark?"
You:   → Call list_work with assignedTo = their user ID
       → Present the results in a clear list
       → Highlight urgent/overdue items
```

### 2. When They Ask to Create Work

```
Human: "Create a task in Quark to review PR #123"
You:   → Call create_work with:
         - title: "Review PR #123"
         - type: "task" or "code"
         - instructions: Include PR link and review criteria
         - assignedTo: (if they specified someone)
       → Confirm the work was created
```

### 3. When They Ask to Work on Something

```
Human: "Take the first task in Quark and do it"
You:   → Call list_work with stage = "triaged" or "in_progress"
       → Call update_work_stage to move to IN PROGRESS
       → Do the work based on instructions
       → Call submit_work with your output
```

### 4. When They Ask About Status

```
Human: "What's the status of the research task?"
You:   → Call get_work with the work ID
       → Report current stage, who it's assigned to, etc.
```

### 5. When They Need to Reassign

```
Human: "Pass the design task to Sarah"
You:   → Call assign_work with work ID and Sarah's user ID
       → Confirm the reassignment
```

### 6. When There's a Problem

```
Human: "The data task is stuck, can't proceed"
You:   → Call update_work_stage with stage = "blocked"
       → Include a reason in the comment
```

---

## Best Practices

### DO

- ✅ Check Quark regularly when working on multiple tasks
- ✅ Always read the `instructions` field - it tells you what to do
- ✅ Submit your work when done, even if imperfect (humans can revise)
- ✅ Use the `success_criteria` field to know when you're done
- ✅ Add comments explaining your work or asking questions
- ✅ Be clear about what you did and what the output is
- ✅ Mark work as blocked if you can't proceed (need info, approval, etc.)

### DON'T

- ❌ Don't work on NEW items (they need human review first)
- ❌ Don't skip the instructions - they're there for a reason
- ❌ Don't submit minimal work - provide complete, usable output
- ❌ Don't forget to add comments for context
- ❌ Don't leave work in IN PROGRESS if you're done - submit it
- ❌ Don't make up information - if you don't know, say so

---

## Output Format

When submitting work, structure your output clearly:

```markdown
## Summary
Brief description of what you did.

## Key Findings / Results
- Point 1
- Point 2
- Point 3

## Files Changed / Output
- file1.md
- file2.json

## Notes
Any caveats, questions, or follow-up suggestions.

## Confidence
- [x] Confident this meets success criteria
- [ ] Some uncertainty, recommend human review
```

---

## Handling Ambiguous Instructions

If the work instructions are unclear:

1. **Ask for clarification via comments** - Add a comment to the work asking the human to clarify
2. **Make reasonable assumptions** - Document what you assumed in your output
3. **Do your best** - It's better to submit something than nothing

Example comment:
```
"Clarification needed: The instructions mention 'the Q3 report' but I couldn't find it. 
I've assumed you want a summary of Q3 metrics based on the data in the shared spreadsheet. 
Please confirm or correct if needed."
```

---

## Error Handling

If a tool call fails:

| Error | What to do |
|-------|------------|
| "Unauthorized" | The user isn't logged in. Ask them to authenticate. |
| "Not found" | The work ID is wrong. Ask for the correct ID. |
| "Cannot transition" | Invalid stage change. Check the lifecycle diagram. |
| "Not authorized" | User doesn't have permission. Ask them to check permissions. |
| "Network error" | Try again in a moment. |

---

## Quick Reference

### List Your Work

```
list_work({ 
  assignedTo: "user-id",
  stage: "triaged" // or omit for all non-done work
})
```

### Submit Completed Work

```
submit_work({
  workId: "work-id",
  content: {
    summary: "...",
    findings: [...],
    output: {...}
  },
  contentType: "markdown" // or "json"
})
```

### Move Work Forward

```
update_work_stage({
  workId: "work-id",
  stage: "in_progress" // or next appropriate stage
})
```

### Add Context

```
add_comment({
  workId: "work-id",
  content: "I've started working on this. Will submit within 2 hours."
})
```

---

## Example Conversations

### Example 1: Daily Check-in

```
Human: "Check Quark and see what I need to do today"
You:   Let me check your Quark inbox.

      [Calling list_work...]
      
      You have 3 items assigned to you:
      
      1. 🔴 URGENT - Review PR #456 (P1)
         Stage: Triaged
         Due: Today
      
      2. ⚡ Research competitor pricing (P2)
         Stage: Triaged
         Due: This week
      
      3. 📝 Draft Q4 report (P3)
         Stage: In Progress (from yesterday)
         Due: Friday
      
      Want me to start on any of these?

Human: "Yes, start the PR review"
You:   I'll move it to In Progress and begin.

      [Calling update_work_stage...]

      Done. I'm now reviewing PR #456. I'll submit my findings shortly.

[Time passes while you review the PR...]

You:   I've completed the review and submitted it.

      [Calling submit_work...]
      
      Summary:
      - Code looks good overall
      - 3 minor suggestions (inline comments)
      - 1 security concern flagged
      - LGTM with changes
      
      The work is now awaiting your review.
```

### Example 2: Creating Work for Someone

```
Human: "Create a task for Sarah to schedule the team meeting"
You:   I'll create that task in Quark for Sarah.

      [Calling create_work...]
      
      Created:
      - Title: Schedule team meeting
      - Type: meeting
      - Assigned to: Sarah
      - Instructions: Find a time that works for all team members this week and send calendar invites
      
      Sarah will be notified and can pick this up.

Human: "Great. Can you also add that it's urgent?"
You:   I'll add a comment to mark it as urgent.

      [Calling add_comment...]
      
      Done. Sarah will see your note.
```

---

## Questions?

If you're unsure about anything, ask your human for clarification. Better to ask than to do the wrong thing.

**Remember:** You're helping your human, not replacing them. They make the final decisions.
