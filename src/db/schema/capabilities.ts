import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { team } from "./teams";

export const capabilityDefinitions = [
  { id: "work:create", name: "Create Work", description: "Create new work items", category: "work" },
  { id: "work:read", name: "Read Work", description: "View work items", category: "work" },
  { id: "work:update", name: "Update Work", description: "Edit work items", category: "work" },
  { id: "work:delete", name: "Delete Work", description: "Delete work items", category: "work" },
  { id: "work:assign", name: "Assign Work", description: "Assign work to users", category: "work" },
  { id: "team:manage", name: "Manage Team", description: "Add/remove team members", category: "team" },
  { id: "team:settings", name: "Team Settings", description: "Edit team settings", category: "team" },
  { id: "admin:view", name: "View Admin", description: "Access admin panel", category: "admin" },
  { id: "admin:users", name: "Manage Users", description: "Manage users in admin", category: "admin" },
  { id: "mcp:use", name: "Use MCP", description: "Use MCP tools", category: "integration" },
  { id: "api:keys", name: "API Keys", description: "Manage API keys", category: "integration" },
  { id: "integrations:github", name: "GitHub", description: "GitHub integration", category: "integration" },
  { id: "integrations:calendar", name: "Calendar", description: "Calendar integration", category: "integration" },
  { id: "analytics:view", name: "View Analytics", description: "View analytics", category: "analytics" },
  { id: "audit:view", name: "View Audit", description: "View audit logs", category: "analytics" },
] as const;

export type CapabilityId = typeof capabilityDefinitions[number]["id"];

export const userCapabilities = pgTable(
  "user_capability",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .references(() => team.id, { onDelete: "cascade" }),
    capability: text("capability").notNull(),
    granted: jsonb("granted").$type<string[]>().notNull(),
    denied: jsonb("denied").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_capability_userId_idx").on(table.userId),
    index("user_capability_teamId_idx").on(table.teamId),
    index("user_capability_capability_idx").on(table.capability),
  ]
);

export const roleCapabilities = pgTable(
  "role_capability",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    capability: text("capability").notNull(),
    granted: jsonb("granted").$type<string[]>().notNull(),
    denied: jsonb("denied").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("role_capability_teamId_idx").on(table.teamId),
    index("role_capability_role_idx").on(table.role),
  ]
);

export const userCapabilitiesRelations = relations(userCapabilities, ({ one }) => ({
  user: one(user, {
    fields: [userCapabilities.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [userCapabilities.teamId],
    references: [team.id],
  }),
}));

export const roleCapabilitiesRelations = relations(roleCapabilities, ({ one }) => ({
  team: one(team, {
    fields: [roleCapabilities.teamId],
    references: [team.id],
  }),
}));
