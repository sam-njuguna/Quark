import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { user } from "./auth-schema";

export const recurringWork = pgTable(
  "recurring_work",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Pattern
    pattern: text("pattern").notNull(), // daily | weekly | monthly
    dayOfWeek: integer("day_of_week"), // 0-6, for weekly
    dayOfMonth: integer("day_of_month"), // 1-31, for monthly

    // Template fields
    templateTitle: text("template_title").notNull(),
    templateType: text("template_type").notNull().default("task"),
    templateDescription: text("template_description"),
    templateInstructions: text("template_instructions"),
    templatePriority: integer("template_priority").default(2),
    templateSuccessCriteria: jsonb("template_success_criteria").$type<string[]>(),

    // Schedule
    nextRunAt: timestamp("next_run_at").notNull(),
    lastRunAt: timestamp("last_run_at"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("recurring_work_teamId_idx").on(table.teamId),
    index("recurring_work_nextRunAt_idx").on(table.nextRunAt),
  ],
);

export const recurringWorkRelations = relations(recurringWork, ({ one }) => ({
  team: one(team, {
    fields: [recurringWork.teamId],
    references: [team.id],
  }),
  creator: one(user, {
    fields: [recurringWork.createdBy],
    references: [user.id],
  }),
}));
