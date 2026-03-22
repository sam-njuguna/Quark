"use server";

import { put } from "@vercel/blob";
import { requireUser } from "@/actions/auth/session";
import { addWorkAttachment } from "@/actions/work/attachments";

export async function uploadFile(formData: FormData) {
  await requireUser();

  const file = formData.get("file") as File;
  const workId = formData.get("workId") as string;

  if (!file) {
    throw new Error("No file provided");
  }

  const uniqueFilename = `${workId || "general"}/${Date.now()}-${file.name}`;

  const arrayBuffer = await file.arrayBuffer();
  const blob = await put(uniqueFilename, arrayBuffer, {
    contentType: file.type,
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  if (workId) {
    const attachmentId = await addWorkAttachment({
      workId,
      filename: file.name,
      contentType: file.type,
      size: file.size.toString(),
      url: blob.url,
    });

    return {
      id: attachmentId,
      url: blob.url,
      filename: file.name,
      contentType: file.type,
      size: file.size.toString(),
    };
  }

  return {
    url: blob.url,
    filename: file.name,
    contentType: file.type,
    size: file.size.toString(),
  };
}
