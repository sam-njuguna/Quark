import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { work } from "./work";

export const workDependency = pgTable(
  "work_dependency",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    dependsOnId: text("depends_on_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("work_dep_workId_idx").on(table.workId),
    index("work_dep_dependsOnId_idx").on(table.dependsOnId),
  ],
);

export const workDependencyRelations = relations(workDependency, ({ one }) => ({
  work: one(work, {
    fields: [workDependency.workId],
    references: [work.id],
    relationName: "blockedByDeps",
  }),
  dependsOn: one(work, {
    fields: [workDependency.dependsOnId],
    references: [work.id],
    relationName: "blocksDeps",
  }),
}));
