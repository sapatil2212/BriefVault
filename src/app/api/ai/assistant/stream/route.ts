import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { fail, ErrorCode } from "@/lib/api/response";
import { assistantSchema } from "@/lib/validations/ai";
import { assistantChatStream } from "@/lib/ai/modules/assistant";

export const runtime = "nodejs";

/**
 * POST /api/ai/assistant/stream
 * General-purpose conversational assistant for the floating dashboard widget.
 * Emits newline-delimited JSON events (application/x-ndjson):
 *   {"type":"delta","text":"..."}          → answer tokens (many)
 *   {"type":"done","provider":..,"model":..} → final metadata
 *
 * Unlike /api/ai/ask, this is not scoped to the user's documents — it's a
 * conversational copilot. Auth is still required so only signed-in users can
 * consume LLM capacity.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  const parsed = assistantSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Please check your input.", {
      status: 422,
      code: ErrorCode.VALIDATION,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    });
  }

  const { messages } = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of assistantChatStream(messages, user.id)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "delta",
              text: `\n⚠️ ${err instanceof Error ? err.message : "Assistant error."}`,
            }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
