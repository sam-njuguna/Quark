import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { work } from "./work";

export const activity = pgTable(
  "activity",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // created, stage_changed, assigned, submitted, approved, rejected, blocked, cancelled, commented
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_workId_idx").on(table.workId),
    index("activity_userId_idx").on(table.userId),
    index("activity_action_idx").on(table.action),
    index("activity_createdAt_idx").on(table.createdAt),
  ],
);

export const activityRelations = relations(activity, ({ one }) => ({
  work: one(work, {
    fields: [activity.workId],
    references: [work.id],
  }),
  user: one(user, {
    fields: [activity.userId],
    references: [user.id],
  }),
}));
