import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { work } from "./work";

export type WorkAttachment = typeof workAttachment.$inferSelect;
export type NewWorkAttachment = typeof workAttachment.$inferInsert;

export const workAttachment = pgTable(
  "work_attachment",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => work.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    size: text("size").notNull(),
    url: text("url").notNull(),
    storageType: text("storage_type").notNull().default("blob"),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("work_attachment_workId_idx").on(table.workId),
    index("work_attachment_uploadedBy_idx").on(table.uploadedBy),
  ],
);

export const workAttachmentRelations = relations(workAttachment, ({ one }) => ({
  work: one(work, {
    fields: [workAttachment.workId],
    references: [work.id],
  }),
  uploader: one(user, {
    fields: [workAttachment.uploadedBy],
    references: [user.id],
  }),
}));
