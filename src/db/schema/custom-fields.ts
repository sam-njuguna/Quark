import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { work } from "./work";
import { team } from "./teams";

export const customFieldDef = pgTable(
  "custom_field_def",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("text"), // text | number | boolean | date | select
    options: jsonb("options").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("custom_field_def_teamId_idx").on(table.teamId)],
);

export const workCustomField = pgTable(
  "work_custom_field",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => customFieldDef.id, { onDelete: "cascade" }),
    value: text("value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("work_custom_field_workId_idx").on(table.workId),
    index("work_custom_field_fieldId_idx").on(table.fieldId),
  ],
);

export const customFieldDefRelations = relations(customFieldDef, ({ one }) => ({
  team: one(team, {
    fields: [customFieldDef.teamId],
    references: [team.id],
  }),
}));

export const workCustomFieldRelations = relations(workCustomField, ({ one }) => ({
  work: one(work, {
    fields: [workCustomField.workId],
    references: [work.id],
  }),
  field: one(customFieldDef, {
    fields: [workCustomField.fieldId],
    references: [customFieldDef.id],
  }),
}));
