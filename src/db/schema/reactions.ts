import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { work } from "./work";

export const reaction = pgTable(
  "reaction",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reaction_workId_idx").on(table.workId),
    index("reaction_userId_idx").on(table.userId),
  ],
);

export const reactionRelations = relations(reaction, ({ one }) => ({
  work: one(work, { fields: [reaction.workId], references: [work.id] }),
  user: one(user, { fields: [reaction.userId], references: [user.id] }),
}));
