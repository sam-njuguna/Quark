"use server";

import { db } from "@/db";
import { teamMember, team, teamInvitation } from "@/db/schema/teams";
import { user, session } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sendTeamInviteEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export async function getTeamMembers(teamId: string) {
  await requireUser();

  return db
    .select({
      id: teamMember.id,
      role: teamMember.role,
      joinedAt: teamMember.joinedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(eq(teamMember.teamId, teamId));
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  role: "member" | "lead" | "admin",
) {
  const currentUser = await requireUser();

  const [myMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, currentUser.id)),
    );

  if (!myMembership || !["lead", "admin"].includes(myMembership.role)) {
    throw new Error("Insufficient permissions to change member roles");
  }

  await db
    .update(teamMember)
    .set({ role })
    .where(and(eq(teamMember.id, memberId), eq(teamMember.teamId, teamId)));
}

export async function removeMember(teamId: string, memberId: string) {
  const currentUser = await requireUser();

  const [myMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, currentUser.id)),
    );

  if (!myMembership || !["lead", "admin"].includes(myMembership.role)) {
    throw new Error("Insufficient permissions to remove members");
  }

  await db
    .delete(teamMember)
    .where(and(eq(teamMember.id, memberId), eq(teamMember.teamId, teamId)));
}

export async function inviteMemberByEmail(
  teamId: string,
  email: string,
  role: "member" | "lead" | "admin" = "member",
) {
  const currentUser = await requireUser();
  const normalizedEmail = email.toLowerCase().trim();

  const [myMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, currentUser.id)),
    );

  if (!myMembership || !["lead", "admin"].includes(myMembership.role)) {
    throw new Error("Insufficient permissions to invite members");
  }

  const [targetUser] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (targetUser) {
    const [existing] = await db
      .select()
      .from(teamMember)
      .where(
        and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, targetUser.id),
        ),
      );

    if (existing) {
      throw new Error("User is already a member of this team");
    }
  }

  const [existingInvite] = await db
    .select()
    .from(teamInvitation)
    .where(
      and(
        eq(teamInvitation.teamId, teamId),
        eq(teamInvitation.email, normalizedEmail),
        eq(teamInvitation.status, "pending"),
      ),
    )
    .limit(1);

  if (existingInvite) {
    throw new Error("An invitation has already been sent to this email");
  }

  const [teamData] = await db
    .select({ name: team.name })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(teamInvitation).values({
    id: nanoid(),
    teamId,
    email: normalizedEmail,
    role,
    token,
    invitedBy: currentUser.id,
    expiresAt,
  });

  const inviteUrl = `${APP_URL}/invite/${token}`;

  try {
    await sendTeamInviteEmail({
      toEmail: normalizedEmail,
      teamName: teamData?.name ?? "the team",
      invitedByName: currentUser.name ?? "A team member",
      role,
      inviteUrl,
    });
  } catch (err) {
    console.error("Failed to send invite email:", err);
  }

  revalidatePath("/dashboard/settings");
}

export async function getTeamInvitations(teamId: string) {
  const currentUser = await requireUser();

  const [myMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, currentUser.id)),
    );

  if (!myMembership || !["lead", "admin"].includes(myMembership.role)) {
    throw new Error("Insufficient permissions to view invitations");
  }

  return db
    .select({
      id: teamInvitation.id,
      email: teamInvitation.email,
      role: teamInvitation.role,
      status: teamInvitation.status,
      expiresAt: teamInvitation.expiresAt,
      createdAt: teamInvitation.createdAt,
      inviter: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(teamInvitation)
    .leftJoin(user, eq(teamInvitation.invitedBy, user.id))
    .where(
      and(
        eq(teamInvitation.teamId, teamId),
        eq(teamInvitation.status, "pending"),
      ),
    )
    .orderBy(teamInvitation.createdAt);
}

export async function cancelInvitation(invitationId: string) {
  const currentUser = await requireUser();

  const [invitation] = await db
    .select()
    .from(teamInvitation)
    .where(eq(teamInvitation.id, invitationId))
    .limit(1);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  const [myMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, invitation.teamId),
        eq(teamMember.userId, currentUser.id),
      ),
    );

  if (!myMembership || !["lead", "admin"].includes(myMembership.role)) {
    throw new Error("Insufficient permissions to cancel invitations");
  }

  await db.delete(teamInvitation).where(eq(teamInvitation.id, invitationId));

  revalidatePath("/dashboard/settings");
}

export async function getInvitationByToken(token: string) {
  const [invitation] = await db
    .select({
      id: teamInvitation.id,
      email: teamInvitation.email,
      role: teamInvitation.role,
      status: teamInvitation.status,
      expiresAt: teamInvitation.expiresAt,
      teamId: teamInvitation.teamId,
      team: {
        id: team.id,
        name: team.name,
      },
      inviter: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(teamInvitation)
    .innerJoin(team, eq(teamInvitation.teamId, team.id))
    .leftJoin(user, eq(teamInvitation.invitedBy, user.id))
    .where(eq(teamInvitation.token, token))
    .limit(1);

  return invitation;
}

export async function acceptInvitation(token: string) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invalid invitation");
  }

  if (invitation.status !== "pending") {
    throw new Error("This invitation has already been used");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("This invitation has expired");
  }

  let userId: string;
  let isNewUser = false;

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, invitation.email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    userId = existingUser.id;
  } else {
    userId = nanoid();
    await db.insert(user).values({
      id: userId,
      name: invitation.email.split("@")[0],
      email: invitation.email.toLowerCase(),
      emailVerified: true,
    });
    isNewUser = true;
  }

  const [existingMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, invitation.teamId),
        eq(teamMember.userId, userId),
      ),
    );

  if (existingMembership) {
    await db
      .update(teamInvitation)
      .set({ status: "accepted" })
      .where(eq(teamInvitation.token, token));

    return { teamId: invitation.teamId, isNewUser: false, userId };
  }

  await db.insert(teamMember).values({
    id: nanoid(),
    teamId: invitation.teamId,
    userId,
    role: invitation.role as "member" | "lead" | "admin",
  });

  await db
    .update(teamInvitation)
    .set({ status: "accepted" })
    .where(eq(teamInvitation.token, token));

  revalidatePath("/dashboard");

  return { teamId: invitation.teamId, isNewUser, userId };
}

export async function bulkRemoveMembers(teamId: string, memberIds: string[]) {
  const currentUser = await requireUser();

  const [myMembership] = await db
    .select()
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, currentUser.id)),
    );

  if (!myMembership || !["lead", "admin"].includes(myMembership.role)) {
    throw new Error("Insufficient permissions to remove members");
  }

  if (memberIds.length === 0) return;

  await db
    .delete(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), inArray(teamMember.id, memberIds)),
    );

  revalidatePath("/dashboard/settings");
}

export async function updateMemberRoleAction(
  teamId: string,
  memberId: string,
  role: "member" | "lead" | "admin",
) {
  await updateMemberRole(teamId, memberId, role);
  revalidatePath("/dashboard/settings");
}

export async function removeMemberAction(teamId: string, memberId: string) {
  await removeMember(teamId, memberId);
  revalidatePath("/dashboard/settings");
}

export async function createTeam(name: string, description?: string) {
  const currentUser = await requireUser();

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const teamId = nanoid();

  await db.insert(team).values({
    id: teamId,
    name,
    slug: `${slug}-${nanoid(6)}`,
    description,
  });

  await db.insert(teamMember).values({
    id: nanoid(),
    teamId,
    userId: currentUser.id,
    role: "admin",
  });

  return teamId;
}

export async function acceptInvitationWithSession(
  token: string,
): Promise<{ teamId: string }> {
  const result = await acceptInvitation(token);
  const { teamId, userId } = result;

  const sessionToken = nanoid(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(session).values({
    id: nanoid(),
    token: sessionToken,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set("better-auth.session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return { teamId };
}
