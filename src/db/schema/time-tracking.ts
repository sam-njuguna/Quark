import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { work } from "./work";

export const timeLog = pgTable(
  "time_log",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    durationSeconds: integer("duration_seconds"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("time_log_workId_idx").on(table.workId),
    index("time_log_userId_idx").on(table.userId),
    index("time_log_startedAt_idx").on(table.startedAt),
  ],
);

export const timeLogRelations = relations(timeLog, ({ one }) => ({
  work: one(work, {
    fields: [timeLog.workId],
    references: [work.id],
  }),
  user: one(user, {
    fields: [timeLog.userId],
    references: [user.id],
  }),
}));
