import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { team } from "./teams";
import { user } from "./auth-schema";

export const webhook = pgTable(
  "webhook",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    events: jsonb("events")
      .$type<string[]>()
      .notNull()
      .default([
        "work.created",
        "work.stage_changed",
        "work.assigned",
        "work.completed",
        "work.blocked",
        "work.cancelled",
      ]),
    secret: text("secret"),
    isActive: boolean("is_active").notNull().default(true),
    lastTriggeredAt: timestamp("last_triggered_at"),
    lastStatusCode: text("last_status_code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("webhook_teamId_idx").on(table.teamId),
  ],
);

export const webhookRelations = relations(webhook, ({ one }) => ({
  team: one(team, {
    fields: [webhook.teamId],
    references: [team.id],
  }),
  creator: one(user, {
    fields: [webhook.createdBy],
    references: [user.id],
  }),
}));
