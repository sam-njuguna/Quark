"use server";

import { logger } from "@/lib/logger";

export type JobType =
  | "send-email"
  | "generate-digest"
  | "export-work"
  | "cleanup-expired-locks";

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  scheduledAt: Date;
  attempts: number;
}

const jobQueue: Job[] = [];

export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown>,
  scheduledAt: Date = new Date(),
): Promise<Job> {
  const job: Job = {
    id: crypto.randomUUID(),
    type,
    payload,
    scheduledAt,
    attempts: 0,
  };
  jobQueue.push(job);
  logger.info("job.enqueued", { jobId: job.id, type });
  return job;
}

export async function processNextJob(): Promise<Job | null> {
  const now = new Date();
  const idx = jobQueue.findIndex((j) => j.scheduledAt <= now);
  if (idx === -1) return null;

  const [job] = jobQueue.splice(idx, 1);
  job.attempts += 1;
  logger.info("job.processing", { jobId: job.id, type: job.type, attempt: job.attempts });

  try {
    await runJob(job);
    logger.info("job.completed", { jobId: job.id });
  } catch (err) {
    logger.error("job.failed", { jobId: job.id, error: String(err) });
    if (job.attempts < 3) {
      job.scheduledAt = new Date(Date.now() + job.attempts * 30_000);
      jobQueue.push(job);
    }
  }

  return job;
}

async function runJob(job: Job): Promise<void> {
  switch (job.type) {
    case "send-email":
      logger.info("job.send-email", { to: job.payload.to });
      break;
    case "generate-digest":
      logger.info("job.generate-digest", { teamId: job.payload.teamId });
      break;
    case "export-work":
      logger.info("job.export-work", { userId: job.payload.userId });
      break;
    case "cleanup-expired-locks":
      logger.info("job.cleanup-expired-locks");
      break;
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

export function getQueueLength(): number {
  return jobQueue.length;
}
