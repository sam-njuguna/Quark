import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { user } from "./auth-schema";

export const stageAutomation = pgTable(
  "stage_automation",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    triggerStage: text("trigger_stage").notNull(),
    action: text("action").notNull(),
    actionConfig: jsonb("action_config").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stage_auto_teamId_idx").on(table.teamId),
    index("stage_auto_triggerStage_idx").on(table.triggerStage),
  ],
);

export const stageAutomationRelations = relations(stageAutomation, ({ one }) => ({
  team: one(team, { fields: [stageAutomation.teamId], references: [team.id] }),
  creator: one(user, { fields: [stageAutomation.createdBy], references: [user.id] }),
}));
