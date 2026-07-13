import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { fail, ErrorCode } from "@/lib/api/response";
import { askSchema } from "@/lib/validations/ai";
import { askQuestionStream } from "@/lib/ai/modules/ask";
import {
  getOwnedDocument,
  getUserDocumentIds,
} from "@/lib/ai/services/document-service";
import { logAiRequest } from "@/lib/ai/logging";

export const runtime = "nodejs";

/**
 * POST /api/ai/ask/stream
 * Streaming RAG. Emits newline-delimited JSON events (application/x-ndjson):
 *   {"type":"sources","sources":[...]}   → retrieved evidence (first)
 *   {"type":"delta","text":"..."}        → answer tokens (many)
 *   {"type":"done","confidence":..}      → final metadata
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

  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Please check your input.", {
      status: 422,
      code: ErrorCode.VALIDATION,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    });
  }

  const { question, documentId } = parsed.data;

  let scope: string[];
  if (documentId) {
    const doc = await getOwnedDocument(user.id, documentId);
    if (!doc) {
      return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }
    scope = [documentId];
  } else {
    scope = await getUserDocumentIds(user.id);
  }

  const encoder = new TextEncoder();
  const startedAt = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of askQuestionStream(question, scope)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          if (event.type === "done") {
            await logAiRequest({
              userId: user.id,
              documentId: documentId ?? null,
              kind: "ASK",
              provider: event.provider,
              model: event.model,
              latencyMs: Date.now() - startedAt,
              confidence: event.confidence,
              success: !event.notFound,
            });
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "delta",
              text: `\n⚠️ ${err instanceof Error ? err.message : "Stream error."}`,
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
