import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const teamInvitation = pgTable(
  "team_invitation",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: text("role").notNull().default("member"),
    token: varchar("token", { length: 64 }).notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("team_invitation_teamId_idx").on(table.teamId),
    index("team_invitation_email_idx").on(table.email),
    index("team_invitation_token_idx").on(table.token),
  ],
);

export const team = pgTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: text("parent_id"),
  toolPolicy: jsonb("tool_policy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("team_member_teamId_idx").on(table.teamId),
    index("team_member_userId_idx").on(table.userId),
  ],
);

export const teamRelations = relations(team, ({ one, many }) => ({
  members: many(teamMember),
  invitations: many(teamInvitation),
  parent: one(team, {
    fields: [team.parentId],
    references: [team.id],
    relationName: "teamHierarchy",
  }),
  children: many(team, {
    relationName: "teamHierarchy",
  }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const teamInvitationRelations = relations(teamInvitation, ({ one }) => ({
  team: one(team, {
    fields: [teamInvitation.teamId],
    references: [team.id],
  }),
  inviter: one(user, {
    fields: [teamInvitation.invitedBy],
    references: [user.id],
    relationName: "invitedByUser",
  }),
}));
