import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { work as workSchema, workOutput } from "@/db/schema/work";
import { getSession } from "@/actions/auth/session";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { workId } = await params;
  const url = new URL(request.url);
  const lastEventId = url.searchParams.get("lastEventId");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendEvent = (event: string, data: object) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        const [workItem] = await db
          .select()
          .from(workSchema)
          .where(eq(workSchema.id, workId))
          .limit(1);

        if (!workItem) {
          sendEvent("error", { message: "Work not found" });
          controller.close();
          return;
        }

        sendEvent("status", {
          workId: workItem.id,
          aiStatus: workItem.aiStatus,
          aiStartedAt: workItem.aiStartedAt,
          aiCompletedAt: workItem.aiCompletedAt,
          aiError: workItem.aiError,
        });

        if (workItem.aiStatus === "completed") {
          const outputs = await db
            .select()
            .from(workOutput)
            .where(eq(workOutput.workId, workId))
            .orderBy(desc(workOutput.version))
            .limit(1);

          if (outputs.length > 0) {
            sendEvent("output", {
              version: outputs[0].version,
              content: outputs[0].content,
              contentType: outputs[0].contentType,
              createdAt: outputs[0].createdAt,
            });
          }
          sendEvent("done", { workId });
          controller.close();
          return;
        }

        if (workItem.aiStatus === "failed") {
          sendEvent("error", { message: workItem.aiError || "Execution failed" });
          controller.close();
          return;
        }

        let lastStatus = workItem.aiStatus;
        let checkCount = 0;
        const maxChecks = 150;

        while (checkCount < maxChecks) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const [updatedWork] = await db
            .select()
            .from(workSchema)
            .where(eq(workSchema.id, workId))
            .limit(1);

          if (!updatedWork) {
            sendEvent("error", { message: "Work not found" });
            controller.close();
            return;
          }

          if (updatedWork.aiStatus !== lastStatus) {
            lastStatus = updatedWork.aiStatus;
            sendEvent("status", {
              workId: updatedWork.id,
              aiStatus: updatedWork.aiStatus,
              aiStartedAt: updatedWork.aiStartedAt,
              aiCompletedAt: updatedWork.aiCompletedAt,
              aiError: updatedWork.aiError,
            });
          }

          if (updatedWork.aiStatus === "completed") {
            const outputs = await db
              .select()
              .from(workOutput)
              .where(eq(workOutput.workId, workId))
              .orderBy(desc(workOutput.version))
              .limit(1);

            if (outputs.length > 0) {
              sendEvent("output", {
                version: outputs[0].version,
                content: outputs[0].content,
                contentType: outputs[0].contentType,
                createdAt: outputs[0].createdAt,
              });
            }
            sendEvent("done", { workId });
            controller.close();
            return;
          }

          if (updatedWork.aiStatus === "failed") {
            sendEvent("error", { message: updatedWork.aiError || "Execution failed" });
            controller.close();
            return;
          }

          sendEvent("ping", { checkCount: checkCount + 1 });
          checkCount++;
        }

        sendEvent("timeout", { message: "Max wait time reached" });
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
