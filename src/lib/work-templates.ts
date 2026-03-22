export interface WorkTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultInstructions: string;
  successCriteria: string[];
  priority: number;
  icon: string;
}

export const WORK_TEMPLATES: WorkTemplate[] = [
  {
    id: "bug-fix",
    name: "Bug Fix",
    description: "Investigate and fix a software bug",
    type: "task",
    defaultTitle: "Fix: ",
    defaultDescription: "## Problem\n\nDescribe the bug.\n\n## Steps to Reproduce\n\n1. \n\n## Expected Behavior\n\n## Actual Behavior\n",
    defaultInstructions: "Investigate the reported bug. Identify the root cause and implement a fix. Write a test to prevent regression.",
    successCriteria: [
      "Root cause identified and documented",
      "Fix implemented and tested",
      "No regressions introduced",
      "Regression test added",
    ],
    priority: 1,
    icon: "🐛",
  },
  {
    id: "feature",
    name: "New Feature",
    description: "Design and implement a new product feature",
    type: "code",
    defaultTitle: "Feature: ",
    defaultDescription: "## Overview\n\nDescribe the feature.\n\n## Requirements\n\n- \n\n## Acceptance Criteria\n\n- \n",
    defaultInstructions: "Implement the described feature according to the requirements and acceptance criteria. Follow existing code patterns and write tests.",
    successCriteria: [
      "All requirements satisfied",
      "Acceptance criteria met",
      "Unit tests written",
      "Documentation updated",
    ],
    priority: 2,
    icon: "✨",
  },
  {
    id: "research",
    name: "Research Task",
    description: "Investigate a topic and produce findings",
    type: "research",
    defaultTitle: "Research: ",
    defaultDescription: "## Objective\n\nWhat needs to be researched?\n\n## Scope\n\n## Questions to Answer\n\n1. \n",
    defaultInstructions: "Research the given topic thoroughly. Compile findings into a structured report with actionable recommendations.",
    successCriteria: [
      "All research questions answered",
      "Findings documented clearly",
      "Recommendations provided",
      "Sources cited",
    ],
    priority: 2,
    icon: "🔍",
  },
  {
    id: "meeting",
    name: "Meeting",
    description: "Plan and run a meeting with agenda and notes",
    type: "meeting",
    defaultTitle: "Meeting: ",
    defaultDescription: "## Agenda\n\n1. \n\n## Attendees\n\n- \n\n## Pre-read Materials\n\n",
    defaultInstructions: "Prepare meeting agenda, send invites, facilitate discussion, and capture action items.",
    successCriteria: [
      "Agenda distributed in advance",
      "Meeting facilitated effectively",
      "Action items captured",
      "Notes sent to attendees",
    ],
    priority: 2,
    icon: "📅",
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Write or update technical documentation",
    type: "document",
    defaultTitle: "Docs: ",
    defaultDescription: "## What to Document\n\nDescribe what documentation is needed.\n\n## Target Audience\n\n## Outline\n\n",
    defaultInstructions: "Write clear, accurate documentation for the described topic. Follow existing documentation style and structure.",
    successCriteria: [
      "Documentation is accurate and complete",
      "Follows existing style guide",
      "Reviewed for clarity",
      "Published to correct location",
    ],
    priority: 3,
    icon: "📝",
  },
  {
    id: "code-review",
    name: "Code Review",
    description: "Review code changes for quality and correctness",
    type: "code",
    defaultTitle: "Review: ",
    defaultDescription: "## What to Review\n\nLink to PR or code changes.\n\n## Focus Areas\n\n- Correctness\n- Performance\n- Security\n- Maintainability\n",
    defaultInstructions: "Review the provided code changes thoroughly. Check for correctness, security issues, performance implications, and adherence to coding standards.",
    successCriteria: [
      "All changes reviewed",
      "Security issues identified",
      "Performance implications assessed",
      "Feedback provided constructively",
    ],
    priority: 1,
    icon: "👀",
  },
];

export function getTemplate(id: string): WorkTemplate | undefined {
  return WORK_TEMPLATES.find((t) => t.id === id);
}
