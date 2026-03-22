"use server";

import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { requireUser, getSystemRole } from "@/actions/auth/session";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAllUsersWithRoles() {
  const currentUser = await requireUser();
  const systemRole = await getSystemRole(currentUser.id);
  if (systemRole !== "super_admin") throw new Error("Forbidden");

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      systemRole: user.systemRole,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.createdAt));

  // The "original" super_admin is the earliest-created super_admin — they cannot be demoted
  const originalSuperAdminId = users.find((u) => u.systemRole === "super_admin")?.id ?? null;

  return { users, originalSuperAdminId };
}

export async function setUserSystemRole(
  targetUserId: string,
  role: "user" | "super_admin",
) {
  const currentUser = await requireUser();
  const systemRole = await getSystemRole(currentUser.id);
  if (systemRole !== "super_admin") throw new Error("Forbidden");

  // Find the original super_admin (earliest created with that role)
  const allUsers = await db
    .select({ id: user.id, systemRole: user.systemRole, createdAt: user.createdAt })
    .from(user)
    .orderBy(asc(user.createdAt));

  const originalSuperAdminId = allUsers.find((u) => u.systemRole === "super_admin")?.id;

  if (role === "user" && targetUserId === originalSuperAdminId) {
    throw new Error("Cannot demote the original super admin");
  }

  await db
    .update(user)
    .set({ systemRole: role, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  revalidatePath("/dashboard/admin");
}
