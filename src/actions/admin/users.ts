"use server";

import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { requireUser, getSystemRole } from "@/actions/auth/session";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setUserSystemRole(
  targetUserId: string,
  role: "user" | "super_admin",
) {
  const currentUser = await requireUser();
  const callerRole = await getSystemRole(currentUser.id);

  if (callerRole !== "super_admin") {
    throw new Error("Only super admins can change system roles");
  }

  if (targetUserId === currentUser.id) {
    throw new Error("Cannot change your own system role");
  }

  if (role === "user") {
    // Find original super_admin (earliest-created user with super_admin role)
    const allSuperAdmins = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.systemRole, "super_admin"))
      .orderBy(asc(user.createdAt))
      .limit(1);
    const originalId = allSuperAdmins[0]?.id;
    if (originalId && targetUserId === originalId) {
      throw new Error("Cannot demote the original super admin");
    }
  }

  await db
    .update(user)
    .set({ systemRole: role })
    .where(eq(user.id, targetUserId));

  revalidatePath("/dashboard/admin");
}

export async function listAllUsers() {
  const currentUser = await requireUser();
  const callerRole = await getSystemRole(currentUser.id);

  if (callerRole !== "super_admin") {
    throw new Error("Only super admins can list all users");
  }

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      systemRole: user.systemRole,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(user.createdAt);
}
