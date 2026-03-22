import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { team } from "./teams";
import { work } from "./work";

export const sprint = pgTable(
  "sprint",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    goal: text("goal"),
    status: text("status").notNull().default("planning"), // planning, active, completed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sprint_teamId_idx").on(table.teamId),
    index("sprint_status_idx").on(table.status),
    index("sprint_endDate_idx").on(table.endDate),
  ],
);

export const sprintWork = pgTable(
  "sprint_work",
  {
    id: text("id").primaryKey(),
    sprintId: text("sprint_id")
      .notNull()
      .references(() => sprint.id, { onDelete: "cascade" }),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    index("sprint_work_sprintId_idx").on(table.sprintId),
    index("sprint_work_workId_idx").on(table.workId),
  ],
);

export const sprintRelations = relations(sprint, ({ one, many }) => ({
  team: one(team, {
    fields: [sprint.teamId],
    references: [team.id],
  }),
  creator: one(user, {
    fields: [sprint.createdBy],
    references: [user.id],
  }),
  sprintWork: many(sprintWork),
}));

export const sprintWorkRelations = relations(sprintWork, ({ one }) => ({
  sprint: one(sprint, {
    fields: [sprintWork.sprintId],
    references: [sprint.id],
  }),
  work: one(work, {
    fields: [sprintWork.workId],
    references: [work.id],
  }),
}));
