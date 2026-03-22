import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { team } from "./teams";

export const integrationTypes = [
  "github",
  "gitlab",
  "slack",
  "discord",
  "google_calendar",
  "notion",
  "linear",
  "jira",
] as const;

export const integration = pgTable(
  "integration",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>(),
    credentials: jsonb("credentials").$type<Record<string, unknown>>(), // encrypted
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("integration_teamId_idx").on(table.teamId),
    index("integration_type_idx").on(table.type),
  ],
);

export const integrationRelations = relations(integration, ({ one }) => ({
  team: one(team, {
    fields: [integration.teamId],
    references: [team.id],
  }),
}));
