import { NextResponse } from "next/server";
import { db } from "@/db";
import { work } from "@/db/schema/work";
import { getSession } from "@/actions/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const items = await db.select().from(work);
        const header = "id,title,type,stage,priority,createdAt,dueDate\n";
        controller.enqueue(encoder.encode(header));

        for (const item of items) {
          const row = [
            item.id,
            `"${(item.title ?? "").replace(/"/g, '""')}"`,
            item.type ?? "",
            item.stage ?? "",
            item.priority ?? "",
            item.createdAt?.toISOString() ?? "",
            item.dueDate?.toISOString() ?? "",
          ].join(",") + "\n";
          controller.enqueue(encoder.encode(row));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quark-work-export-${Date.now()}.csv"`,
      "Transfer-Encoding": "chunked",
    },
  });
}
