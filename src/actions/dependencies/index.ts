"use server";

import { db } from "@/db";
import { workDependency } from "@/db/schema/work-dependencies";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function addDependency(workId: string, dependsOnId: string) {
  await requireUser();
  if (workId === dependsOnId)
    throw new Error("A work item cannot depend on itself");

  const [dep] = await db
    .insert(workDependency)
    .values({ id: nanoid(), workId, dependsOnId })
    .onConflictDoNothing()
    .returning();
  return dep;
}

export async function removeDependency(workId: string, dependsOnId: string) {
  await requireUser();
  await db
    .delete(workDependency)
    .where(
      eq(workDependency.workId, workId) &&
        eq(workDependency.dependsOnId, dependsOnId),
    );
}

export async function listDependencies(workId: string) {
  await requireUser();
  const rows = await db
    .select({
      id: workDependency.id,
      dependsOnId: workDependency.dependsOnId,
      title: work.title,
      stage: work.stage,
      type: work.type,
    })
    .from(workDependency)
    .innerJoin(work, eq(work.id, workDependency.dependsOnId))
    .where(eq(workDependency.workId, workId));
  return rows;
}

export async function listSubTasks(parentId: string) {
  await requireUser();
  return db.select().from(work).where(eq(work.parentId, parentId));
}

export async function createSubTask(
  parentId: string,
  data: { title: string; type?: string },
) {
  const user = await requireUser();
  const [parent] = await db.select().from(work).where(eq(work.id, parentId));
  if (!parent) throw new Error("Parent work not found");

  const [sub] = await db
    .insert(work)
    .values({
      id: nanoid(),
      parentId,
      title: data.title,
      type: (data.type as "task") ?? "task",
      teamId: parent.teamId,
      createdBy: user.id,
      stage: "new",
    })
    .returning();
  return sub;
}
