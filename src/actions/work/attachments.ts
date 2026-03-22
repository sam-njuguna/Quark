"use server";

import { db } from "@/db";
import { workAttachment } from "@/db/schema";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getWorkAttachments(workId: string) {
  await requireUser();

  const attachments = await db
    .select({
      id: workAttachment.id,
      workId: workAttachment.workId,
      filename: workAttachment.filename,
      contentType: workAttachment.contentType,
      size: workAttachment.size,
      url: workAttachment.url,
      uploadedBy: workAttachment.uploadedBy,
      createdAt: workAttachment.createdAt,
      uploaderName: workAttachment.uploadedBy,
    })
    .from(workAttachment)
    .where(eq(workAttachment.workId, workId))
    .orderBy(workAttachment.createdAt);

  return attachments;
}

export async function addWorkAttachment(data: {
  workId: string;
  filename: string;
  contentType: string;
  size: string;
  url: string;
}) {
  const currentUser = await requireUser();

  const id = nanoid();
  await db.insert(workAttachment).values({
    id,
    workId: data.workId,
    filename: data.filename,
    contentType: data.contentType,
    size: data.size,
    url: data.url,
    uploadedBy: currentUser.id,
  });

  return id;
}

export async function deleteWorkAttachment(attachmentId: string) {
  await requireUser();

  await db
    .delete(workAttachment)
    .where(eq(workAttachment.id, attachmentId));
}

export async function formatFileSize(bytes: string): Promise<string> {
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getFileIcon(contentType: string): Promise<string> {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "spreadsheet";
  if (contentType.includes("document") || contentType.includes("word")) return "doc";
  return "file";
}

export async function isPreviewable(contentType: string): Promise<boolean> {
  return (
    contentType.startsWith("image/") ||
    contentType === "application/pdf" ||
    contentType.startsWith("text/")
  );
}
