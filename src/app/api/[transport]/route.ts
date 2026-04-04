/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createMcpHandler } from "mcp-handler";
import { headers } from "next/headers";
import { db } from "@/db";
import { apiKey } from "@/db/schema/api-key";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";
import * as mcp from "@/actions/mcp";
import {
  createWorkInput,
  listWorkInput,
  workIdInput,
  updateStageInput,
  submitWorkInput,
  rejectWorkInput,
  blockWorkInput,
  cancelWorkInput,
  assignWorkInput,
  addCommentInput,
  listCommentsInput,
  mcpResponse,
  mcpError,
} from "@/lib/mcp-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function validateToken() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error(
      "Missing or invalid Authorization header. Use: Bearer <your-api-key>",
    );
  }
  const token = authHeader.slice(7);
  if (!token.startsWith("qkp_")) {
    throw new Error("Invalid token format. Expected a key starting with qkp_");
  }
  const result = await db
    .select({
      key: apiKey,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(apiKey)
    .innerJoin(user, eq(apiKey.userId, user.id))
    .where(eq(apiKey.key, token))
    .limit(1);
  if (result.length === 0) {
    throw new Error("Invalid or expired token");
  }
  const { key: keyRecord, user: userData } = result[0];
  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    throw new Error("Token has expired");
  }
  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, keyRecord.id));
  return userData;
}

async function getDisabledToolsForToken(): Promise<Set<string>> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Set();
    const token = authHeader.slice(7);
    const result = await db
      .select({ disabledTools: apiKey.disabledTools })
      .from(apiKey)
      .where(eq(apiKey.key, token))
      .limit(1);
    return new Set((result[0]?.disabledTools as string[]) ?? []);
  } catch {
    return new Set();
  }
}

// ─── Tool wrapper (auth + disabled-tool check) ────────────────────────────────

function makeTool<T>(
  name: string,
  fn: (
    user: Awaited<ReturnType<typeof validateToken>>,
    params: T,
  ) => Promise<unknown>,
) {
  return async (params: T) => {
    try {
      const [userData, disabled] = await Promise.all([
        validateToken(),
        getDisabledToolsForToken(),
      ]);
      if (disabled.has(name)) {
        return mcpError(
          new Error(`Tool '${name}' is disabled for your API key`),
        );
      }
      return mcpResponse(await fn(userData, params));
    } catch (e) {
      return mcpError(e);
    }
  };
}

// ─── MCP Handler ──────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "create_work",
      {
        title: "Create Work",
        description:
          "Create a new work item in Quark. Use this to create tasks, research, documents, code, meetings, or communication items.",
        inputSchema: createWorkInput,
      },
      makeTool("create_work", (user, params) =>
        mcp.mcpCreateWork(user, params),
      ),
    );

    server.registerTool(
      "list_work",
      {
        title: "List Work",
        description:
          "List work items with optional filters for stage, type, assignee, creator, or team.",
        inputSchema: listWorkInput,
      },
      makeTool("list_work", (user, params) => mcp.mcpListWork(user, params)),
    );

    server.registerTool(
      "list_my_work",
      {
        title: "List My Work",
        description:
          "List all work items assigned to the authenticated agent/user.",
        inputSchema: {},
      },
      makeTool("list_my_work", (user) => mcp.mcpListMyWork(user)),
    );

    server.registerTool(
      "get_work",
      {
        title: "Get Work",
        description:
          "Get full details of a work item including outputs and comments.",
        inputSchema: workIdInput,
      },
      makeTool("get_work", (user, { workId }) => mcp.mcpGetWork(user, workId)),
    );

    server.registerTool(
      "update_work_stage",
      {
        title: "Update Work Stage",
        description:
          "Move a work item to a new stage. Valid stages: triaged, in_progress, awaiting_review, revision, blocked, done, cancelled.",
        inputSchema: updateStageInput,
      },
      makeTool("update_work_stage", (user, { workId, stage, reason }) =>
        mcp.mcpUpdateStage(user, workId, stage, reason),
      ),
    );

    server.registerTool(
      "start_work",
      {
        title: "Start Work",
        description:
          "Mark a work item as in_progress. Use this when you begin working on an assigned task.",
        inputSchema: workIdInput,
      },
      makeTool("start_work", (user, { workId }) =>
        mcp.mcpUpdateStage(user, workId, "in_progress"),
      ),
    );

    server.registerTool(
      "submit_work",
      {
        title: "Submit Work",
        description:
          "Submit completed work for human review. Moves the item to awaiting_review stage.",
        inputSchema: submitWorkInput,
      },
      makeTool("submit_work", (user, { workId, content, contentType }) =>
        mcp.mcpSubmitWork(user, workId, content, contentType ?? "markdown"),
      ),
    );

    server.registerTool(
      "approve_work",
      {
        title: "Approve Work",
        description: "Approve submitted work and mark it as done.",
        inputSchema: workIdInput,
      },
      makeTool("approve_work", (user, { workId }) =>
        mcp.mcpApproveWork(user, workId),
      ),
    );

    server.registerTool(
      "reject_work",
      {
        title: "Reject Work",
        description:
          "Reject submitted work and send it back for revision with feedback.",
        inputSchema: rejectWorkInput,
      },
      makeTool("reject_work", (user, { workId, feedback }) =>
        mcp.mcpRejectWork(user, workId, feedback),
      ),
    );

    server.registerTool(
      "block_work",
      {
        title: "Block Work",
        description: "Mark a work item as blocked with a reason.",
        inputSchema: blockWorkInput,
      },
      makeTool("block_work", (user, { workId, reason }) =>
        mcp.mcpBlockWork(user, workId, reason),
      ),
    );

    server.registerTool(
      "cancel_work",
      {
        title: "Cancel Work",
        description: "Cancel a work item that is no longer needed.",
        inputSchema: cancelWorkInput,
      },
      makeTool("cancel_work", (user, { workId, reason }) =>
        mcp.mcpCancelWork(user, workId, reason),
      ),
    );

    server.registerTool(
      "assign_work",
      {
        title: "Assign Work",
        description: "Assign a work item to a specific user by their user ID.",
        inputSchema: assignWorkInput,
      },
      makeTool("assign_work", (user, { workId, userId }) =>
        mcp.mcpAssignWork(user, workId, userId),
      ),
    );

    server.registerTool(
      "add_comment",
      {
        title: "Add Comment",
        description:
          "Add a comment to a work item. Use for updates, questions, or progress notes.",
        inputSchema: addCommentInput,
      },
      makeTool("add_comment", (user, { workId, content }) =>
        mcp.mcpAddComment(user, workId, content),
      ),
    );

    server.registerTool(
      "list_comments",
      {
        title: "List Comments",
        description: "List all comments on a work item.",
        inputSchema: listCommentsInput,
      },
      makeTool("list_comments", (user, { workId, limit }) =>
        mcp.mcpListComments(user, workId, limit),
      ),
    );

    server.registerTool(
      "get_my_pending_work",
      {
        title: "Get My Pending Work",
        description:
          "Get all triaged and in_progress work assigned to you. Use at session start to see what needs attention.",
        inputSchema: {},
      },
      makeTool("get_my_pending_work", async (user) => {
        const work = await mcp.mcpListMyWork(user);
        return work.filter((w) => ["triaged", "in_progress"].includes(w.stage));
      }),
    );

    server.registerTool(
      "get_my_review_queue",
      {
        title: "Get My Review Queue",
        description: "Get all work items awaiting your review.",
        inputSchema: {},
      },
      makeTool("get_my_review_queue", (user) =>
        mcp.mcpListWork(user, { stage: "awaiting_review" }),
      ),
    );

    server.registerTool(
      "suggest_next_steps",
      {
        title: "Suggest Next Steps",
        description:
          "Get AI-suggested next steps for a work item based on its title, description, and type.",
        inputSchema: workIdInput,
      },
      makeTool("suggest_next_steps", async (user, { workId }) => {
        return mcp.mcpSuggestNextSteps(user, workId);
      }),
    );

    server.registerTool(
      "auto_triage",
      {
        title: "Auto Triage Work",
        description:
          "Automatically analyze and suggest priority, type, and stage for a work item based on its content.",
        inputSchema: workIdInput,
      },
      makeTool("auto_triage", async (user, { workId }) => {
        return mcp.mcpAutoTriage(user, workId);
      }),
    );

    server.registerTool(
      "summarize_work",
      {
        title: "Summarize Work",
        description:
          "Get an AI-generated summary of a work item including its title, description, and recent activity.",
        inputSchema: workIdInput,
      },
      makeTool("summarize_work", async (user, { workId }) => {
        return mcp.mcpSummarizeWork(user, workId);
      }),
    );

    server.registerTool(
      "find_related_work",
      {
        title: "Find Related Work",
        description:
          "Find work items related to a given work item based on semantic similarity.",
        inputSchema: workIdInput,
      },
      makeTool("find_related_work", async (user, { workId }) => {
        return mcp.mcpFindRelatedWork(user, workId);
      }),
    );
  },
  {
    serverInfo: { name: "quark-mcp", version: "1.0.0" },
  },
  {
    basePath: "/api",
    verboseLogs: false,
    maxDuration: 60,
    disableSse: true,
  },
);

export { handler as GET, handler as POST };
