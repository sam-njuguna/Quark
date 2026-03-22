import { NextResponse } from "next/server";
import { subscribeToPush } from "@/actions/notifications/push";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = subscribeSchema.parse(json);

    const id = await subscribeToPush({
      endpoint: data.endpoint,
      keys: data.keys,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subscription data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Push subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
}
