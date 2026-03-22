"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { desc } from "drizzle-orm";

export async function exportWorkCsv(): Promise<string> {
  await requireUser();

  const rows = await db
    .select({
      id: work.id,
      title: work.title,
      type: work.type,
      stage: work.stage,
      priority: work.priority,
      teamId: work.teamId,
      createdBy: work.createdBy,
      assignedTo: work.assignedTo,
      dueDate: work.dueDate,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      completedAt: work.completedAt,
    })
    .from(work)
    .orderBy(desc(work.createdAt));

  const headers = [
    "id", "title", "type", "stage", "priority",
    "teamId", "createdBy", "assignedTo", "dueDate",
    "createdAt", "updatedAt", "completedAt",
  ];

  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h as keyof typeof r];
          if (val == null) return "";
          const str = String(val instanceof Date ? val.toISOString() : val);
          return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(","),
    ),
  ];

  return csvLines.join("\n");
}
