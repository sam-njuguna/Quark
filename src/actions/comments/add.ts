"use server";

import { db } from "@/db";
import { comment } from "@/db/schema/comments";
import { activity } from "@/db/schema/activity";
import { work } from "@/db/schema/work";
import { user as userTable } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { sanitizeText, parseMentions } from "@/lib/sanitize";
import { sendMentionNotificationEmail } from "@/lib/email";
import { nanoid } from "nanoid";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";

const addCommentSchema = z.object({
  workId: z.string().min(1),
  content: z.string().min(1).max(10000),
});

export async function addComment(data: z.infer<typeof addCommentSchema>) {
  const user = await requireUser();

  const validated = addCommentSchema.parse(data);
  const safeContent = sanitizeText(validated.content);
  const mentions = parseMentions(safeContent);

  const [newComment] = await db
    .insert(comment)
    .values({
      id: nanoid(),
      workId: validated.workId,
      authorId: user.id,
      content: safeContent,
    })
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId: validated.workId,
    userId: user.id,
    action: "commented",
    metadata: {
      commentId: newComment.id,
      content: safeContent,
      mentions,
    },
  });

  // Send mention notification emails (fire and forget)
  if (mentions.length > 0) {
    try {
      const [workItem] = await db
        .select({ title: work.title })
        .from(work)
        .where(eq(work.id, validated.workId))
        .limit(1);

      const mentionedUsers = await db
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(inArray(userTable.name, mentions));

      const authorName = user.name ?? user.email ?? "Someone";

      for (const mentioned of mentionedUsers) {
        if (mentioned.email && mentioned.email !== user.email) {
          await sendMentionNotificationEmail({
            toEmail: mentioned.email,
            toName: mentioned.name ?? "",
            mentionedBy: authorName,
            workTitle: workItem?.title ?? "a work item",
            workId: validated.workId,
            commentContent: safeContent,
          });
        }
      }
    } catch {
      // Non-critical: don't fail comment creation if email fails
    }
  }

  return newComment;
}
