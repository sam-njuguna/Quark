import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { webhook } from "./webhooks";

export const webhookLog = pgTable(
  "webhook_log",
  {
    id: text("id").primaryKey(),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhook.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    statusCode: integer("status_code"),
    responseMs: integer("response_ms"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("webhook_log_webhookId_idx").on(table.webhookId),
    index("webhook_log_createdAt_idx").on(table.createdAt),
  ],
);

export const webhookLogRelations = relations(webhookLog, ({ one }) => ({
  webhook: one(webhook, {
    fields: [webhookLog.webhookId],
    references: [webhook.id],
  }),
}));
