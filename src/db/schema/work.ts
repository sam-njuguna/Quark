import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { team } from "./teams";

export type Work = typeof work.$inferSelect;
export type WorkOutput = typeof workOutput.$inferSelect;
export type NewWork = typeof work.$inferInsert;

export const workStages = [
  "new",
  "triaged",
  "in_progress",
  "awaiting_review",
  "revision",
  "blocked",
  "done",
  "cancelled",
] as const;

export const workTypes = [
  "task",
  "meeting",
  "research",
  "code",
  "document",
  "communication",
] as const;

export const work = pgTable(
  "work",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    type: text("type").notNull().default("task"),
    description: text("description"),
    instructions: text("instructions"), // AI instructions
    successCriteria: jsonb("success_criteria").$type<string[]>(),

    // Assignment
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assignedTo: text("assigned_to").references(() => user.id, {
      onDelete: "set null",
    }),
    claimedBy: text("claimed_by").references(() => user.id, {
      onDelete: "set null",
    }),

    // Sub-tasks
    parentId: text("parent_id"),

    // Stage
    stage: text("stage").notNull().default("new"),

    // Metadata
    priority: integer("priority").default(2), // 1 (high) - 3 (low)
    dueDate: timestamp("due_date"),
    blockedReason: text("blocked_reason"),
    meetingUrl: text("meeting_url"),
    githubRepo: text("github_repo"),
    githubIssueUrl: text("github_issue_url"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    submittedAt: timestamp("submitted_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("work_teamId_idx").on(table.teamId),
    index("work_createdBy_idx").on(table.createdBy),
    index("work_assignedTo_idx").on(table.assignedTo),
    index("work_stage_idx").on(table.stage),
    index("work_type_idx").on(table.type),
  ],
);

export const workOutput = pgTable(
  "work_output",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: jsonb("content").notNull().$type<Record<string, unknown>>(),
    contentType: text("content_type").notNull().default("markdown"), // markdown, json, files
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("work_output_workId_idx").on(table.workId)],
);

export const workRelations = relations(work, ({ one, many }) => ({
  team: one(team, {
    fields: [work.teamId],
    references: [team.id],
  }),
  creator: one(user, {
    fields: [work.createdBy],
    references: [user.id],
    relationName: "createdWork",
  }),
  assignee: one(user, {
    fields: [work.assignedTo],
    references: [user.id],
    relationName: "assignedWork",
  }),
  claimer: one(user, {
    fields: [work.claimedBy],
    references: [user.id],
    relationName: "claimedWork",
  }),
  outputs: many(workOutput),
}));

export const workOutputRelations = relations(workOutput, ({ one }) => ({
  work: one(work, {
    fields: [workOutput.workId],
    references: [work.id],
  }),
  submitter: one(user, {
    fields: [workOutput.submittedBy],
    references: [user.id],
  }),
}));
