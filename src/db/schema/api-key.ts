import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    name: text("name").notNull().default("MCP Token"),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    disabledTools: jsonb("disabled_tools").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_key_userId_idx").on(table.userId),
    index("api_key_key_idx").on(table.key),
  ],
);

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}));
