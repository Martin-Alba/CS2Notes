import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { getNotificationChannel } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const channel = getNotificationChannel(session.user.id);

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (!closed) {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      };

      send(JSON.stringify({ type: "connected", userId: session.user.id }));

      try {
        const subscriber = redis.subscribe(channel);
        subscriber.on("message", (event) => {
          send(JSON.stringify(event.message));
        });
        subscriber.on("error", () => {
          send(JSON.stringify({ type: "error" }));
        });
      } catch {
        // Redis unavailable - SSE will just keep the connection open
        // Client polling fallback handles it
      }

      request.signal.addEventListener("abort", () => {
        closed = true;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
