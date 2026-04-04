import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { team } from "./teams";
import { work } from "./work";

export const agent = pgTable("agent", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
  
  // Agent configuration
  agentType: text("agent_type").notNull().default("mcp"), // mcp, webhook, api, ai
  
  // Work types this agent can handle (capabilities)
  workTypes: jsonb("work_types").$type<string[]>().default(["task"]),
  
  // Output format expected from AI
  outputFormat: text("output_format").default("markdown"), // markdown, json, text
  
  config: jsonb("config").$type<{
    mcpServerUrl?: string;
    webhookUrl?: string;
    apiKey?: string;
    model?: string;
    systemPrompt?: string;
  }>(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at"),
  
  // Limits
  maxConcurrentTasks: text("max_concurrent_tasks").default("5"),
  rateLimit: text("rate_limit").default("60"), // tasks per hour
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const agentRelations = relations(agent, ({ one, many }) => ({
  team: one(team, {
    fields: [agent.teamId],
    references: [team.id],
  }),
  owner: one(user, {
    fields: [agent.ownerId],
    references: [user.id],
  }),
  tasks: many(agentTask),
  workLogs: many(agentWorkLog),
}));

// Task assigned to an agent
export const agentTask = pgTable("agent_task", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").references(() => agent.id, { onDelete: "cascade" }).notNull(),
  workId: text("work_id").references(() => work.id, { onDelete: "cascade" }),
  
  // Task details
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  
  // Status
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, completed, failed, cancelled
  result: jsonb("result").$type<Record<string, unknown>>(),
  error: text("error"),
  
  // Timing
  assignedAt: timestamp("assigned_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Retry
  retryCount: text("retry_count").default("0"),
  maxRetries: text("max_retries").default("3"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("agent_task_agentId_idx").on(table.agentId),
  index("agent_task_status_idx").on(table.status),
  index("agent_task_workId_idx").on(table.workId),
]);

export const agentTaskRelations = relations(agentTask, ({ one }) => ({
  agent: one(agent, {
    fields: [agentTask.agentId],
    references: [agent.id],
  }),
  work: one(work, {
    fields: [agentTask.workId],
    references: [work.id],
  }),
}));

// Work log - detailed activity tracking
export const agentWorkLog = pgTable("agent_work_log", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").references(() => agent.id, { onDelete: "cascade" }).notNull(),
  taskId: text("task_id").references(() => agentTask.id, { onDelete: "cascade" }),
  workId: text("work_id").references(() => work.id, { onDelete: "cascade" }),
  
  // Log details
  action: text("action").notNull(), // task_received, task_started, task_completed, task_failed, error, heartbeat
  message: text("message"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  
  // Timing
  duration: text("duration"), // in milliseconds
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("agent_work_log_agentId_idx").on(table.agentId),
  index("agent_work_log_taskId_idx").on(table.taskId),
  index("agent_work_log_createdAt_idx").on(table.createdAt),
]);

export const agentWorkLogRelations = relations(agentWorkLog, ({ one }) => ({
  agent: one(agent, {
    fields: [agentWorkLog.agentId],
    references: [agent.id],
  }),
  task: one(agentTask, {
    fields: [agentWorkLog.taskId],
    references: [agentTask.id],
  }),
  work: one(work, {
    fields: [agentWorkLog.workId],
    references: [work.id],
  }),
}));
