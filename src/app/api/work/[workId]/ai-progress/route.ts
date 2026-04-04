import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { work as workSchema } from "@/db/schema/work";
import { getSession } from "@/actions/auth/session";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workId } = await params;

  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(eq(workSchema.id, workId))
    .limit(1);

  if (!workItem) {
    return NextResponse.json({ error: "Work not found" }, { status: 404 });
  }

  return NextResponse.json({
    aiProgress: workItem.aiProgress,
    aiStatus: workItem.aiStatus,
    stage: workItem.stage,
  });
}
