import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export interface DaySchedule {
  isAvailable: boolean;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface WeeklySchedule {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
}

export const defaultWeeklySchedule: WeeklySchedule = {
  mon: { isAvailable: true, startTime: "09:00", endTime: "17:00" },
  tue: { isAvailable: true, startTime: "09:00", endTime: "17:00" },
  wed: { isAvailable: true, startTime: "09:00", endTime: "17:00" },
  thu: { isAvailable: true, startTime: "09:00", endTime: "17:00" },
  fri: { isAvailable: true, startTime: "09:00", endTime: "17:00" },
  sat: { isAvailable: false, startTime: "09:00", endTime: "13:00" },
  sun: { isAvailable: false, startTime: "09:00", endTime: "13:00" },
};

export const userAvailability = pgTable(
  "user_availability",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("available"), // available | busy | away | dnd | offline
    statusNote: text("status_note"),
    timezone: text("timezone").notNull().default("UTC"),
    weeklySchedule: jsonb("weekly_schedule").$type<WeeklySchedule>(),
    showAvailability: boolean("show_availability").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_availability_userId_idx").on(table.userId)],
);

export const userAvailabilityRelations = relations(
  userAvailability,
  ({ one }) => ({
    user: one(user, {
      fields: [userAvailability.userId],
      references: [user.id],
    }),
  }),
);
