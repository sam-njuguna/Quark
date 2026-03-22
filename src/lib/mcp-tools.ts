import { z } from "zod";

// Shared schemas
export const workTypeSchema = z.enum([
  "task",
  "meeting",
  "research",
  "code",
  "document",
  "communication",
]);

export const workStageSchema = z.enum([
  "new",
  "triaged",
  "in_progress",
  "awaiting_review",
  "revision",
  "blocked",
  "done",
  "cancelled",
]);

export const updateStageSchema = z.enum([
  "triaged",
  "in_progress",
  "awaiting_review",
  "revision",
  "blocked",
  "done",
  "cancelled",
]);

// Tool input schemas — wrapped with z.object() and typed as z.ZodTypeAny so TypeScript
// takes the AnySchema inference path in ToolCallback<InputArgs>, skipping ShapeOutput<>
// which causes heap OOM / deep instantiation errors with complex Zod chains.
export const createWorkInput: z.ZodTypeAny = z.object({
  title: z.string().min(1).describe("Title of the work item"),
  type: workTypeSchema.optional().describe("Type of work"),
  description: z.string().optional().describe("Detailed description"),
  instructions: z.string().optional().describe("Instructions for the AI agent"),
  assignedTo: z.string().optional().describe("User ID to assign to"),
  teamId: z.string().optional().describe("Team ID"),
  priority: z
    .number()
    .min(1)
    .max(3)
    .optional()
    .describe("Priority: 1 (high) to 3 (low)"),
  dueDate: z.string().optional().describe("Due date in ISO format"),
  successCriteria: z.array(z.string()).optional().describe("Success criteria"),
});

export const listWorkInput: z.ZodTypeAny = z.object({
  stage: workStageSchema.optional().describe("Filter by stage"),
  assignedTo: z.string().optional().describe("Filter by assigned user ID"),
  createdBy: z.string().optional().describe("Filter by creator user ID"),
  type: z.string().optional().describe("Filter by work type"),
  teamId: z.string().optional().describe("Filter by team ID"),
  limit: z.number().optional().describe("Max results (default 20)"),
});

export const workIdInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
});

export const updateStageInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  stage: updateStageSchema.describe("New stage"),
  reason: z
    .string()
    .optional()
    .describe("Reason for stage change (required for blocked)"),
});

export const submitWorkInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  content: z.record(z.unknown()).describe("Work output content"),
  contentType: z
    .enum(["markdown", "json", "files"])
    .optional()
    .describe("Content type (default: markdown)"),
});

export const rejectWorkInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  feedback: z.string().describe("Feedback explaining what needs to be changed"),
});

export const blockWorkInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  reason: z.string().describe("Reason for blocking"),
});

export const cancelWorkInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  reason: z.string().optional().describe("Reason for cancellation"),
});

export const assignWorkInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  userId: z.string().describe("User ID to assign to"),
});

export const addCommentInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  content: z.string().describe("Comment content"),
});

export const listCommentsInput: z.ZodTypeAny = z.object({
  workId: z.string().describe("Work item ID"),
  limit: z.number().optional().describe("Max results (default 50)"),
});

// Helper to create MCP response
export function mcpResponse(data: unknown): {
  content: Array<{ type: "text"; text: string }>;
} {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function mcpError(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  return {
    content: [
      {
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    ],
    isError: true,
  };
}
