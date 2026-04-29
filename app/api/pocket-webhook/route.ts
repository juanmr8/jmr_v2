import { createHmac, timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { savePocketNoteToNotion } from "@/lib/notion";

const POCKET_EVENT = "summary.completed";
const ANTHROPIC_MODEL = "claude-opus-4-5";
const DEBUG_WEBHOOK = process.env.POCKET_WEBHOOK_DEBUG === "true";

type PocketTranscriptEntry = {
  speaker?: string;
  text?: string;
  start?: number;
  end?: number;
};

type PocketPayload = {
  event?: string;
  recording?: {
    id?: string;
    title?: string;
    duration?: number;
    createdAt?: string;
  };
  summarizations?: Record<
    string,
    {
      v2?: {
        summary?: {
          markdown?: string;
        };
      };
    }
  >;
  transcript?: PocketTranscriptEntry[];
};

function getPocketMarkdownSummary(payload: PocketPayload): string {
  if (!payload.summarizations || typeof payload.summarizations !== "object") return "";

  const firstSummarization = Object.values(payload.summarizations)[0];
  return firstSummarization?.v2?.summary?.markdown ?? "";
}

function normalizePocketSignature(signatureHeader: string | null): string | null {
  if (!signatureHeader) return null;
  const rawSignature = signatureHeader.trim();
  if (!rawSignature) return null;

  // Support plain hex, sha256=..., or v1=... formats.
  const firstSegment = rawSignature.split(",")[0]?.trim() ?? "";
  const withoutPrefix = firstSegment
    .replace(/^sha256=/i, "")
    .replace(/^v1=/i, "")
    .trim()
    .toLowerCase();

  return withoutPrefix || null;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

function verifyPocketSignature({
  rawBody,
  timestamp,
  signature,
  secret,
}: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
}): boolean {
  if (!rawBody || !timestamp || !signature || !secret) return false;

  const normalizedTimestamp = timestamp.trim();
  const normalizedSecret = secret.trim();
  if (!normalizedTimestamp || !normalizedSecret) return false;

  const normalizedSignature = normalizePocketSignature(signature);
  if (!normalizedSignature) return false;

  const expectedWithTimestamp = createHmac("sha256", normalizedSecret)
    .update(`${normalizedTimestamp}.${rawBody}`)
    .digest("hex");
  const expectedBodyOnly = createHmac("sha256", normalizedSecret).update(rawBody).digest("hex");

  try {
    // Pocket docs use {timestamp}.{body}; body-only is a compatibility fallback.
    return (
      timingSafeHexEqual(expectedWithTimestamp, normalizedSignature) ||
      timingSafeHexEqual(expectedBodyOnly, normalizedSignature)
    );
  } catch {
    return false;
  }
}

function formatTranscript(transcript: PocketTranscriptEntry[] = []): string {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return "No transcript provided.";
  }

  return transcript
    .map((entry) => {
      const speaker = entry?.speaker || "Speaker";
      const text = entry?.text || "";
      const start = typeof entry?.start === "number" ? entry.start.toFixed(1) : "?";
      const end = typeof entry?.end === "number" ? entry.end.toFixed(1) : "?";
      return `[${start}s - ${end}s] ${speaker}: ${text}`;
    })
    .join("\n");
}

async function generateStructuredMarkdown({
  title,
  summaryMarkdown,
  transcript,
}: {
  title: string;
  summaryMarkdown: string;
  transcript: PocketTranscriptEntry[];
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = [
    "You are processing a voice note.",
    "Use the provided Pocket summary and transcript to produce structured markdown.",
    "Classify the note type in the Summary section (for example: meeting notes, personal reminder, idea dump, journal, task review).",
    "Output exactly these top-level sections in this order:",
    "## Summary",
    "## Key points",
    "## Action items",
    "## Pocket summary",
    "## Raw transcript",
    "",
    "Use concise, useful bullets for Key points and Action items.",
    "If no action items exist, explicitly write '- None.' under Action items.",
    "Under Pocket summary, include the Pocket summary content faithfully with only light cleanup.",
    "For Raw transcript, preserve the speaker/time ordering and keep it faithful.",
    "",
    `Recording title: ${title || "Untitled recording"}`,
    "",
    "Pocket summary markdown:",
    summaryMarkdown || "No Pocket summary available.",
    "",
    "Transcript:",
    formatTranscript(transcript),
  ].join("\n");

  const completion = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1800,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = completion.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!textContent) {
    throw new Error("Claude returned an empty response.");
  }

  return textContent;
}

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const pocketSecret = process.env.POCKET_WEBHOOK_SECRET;
  const rawBody = await request.text();

  // If no secret is configured, skip signature verification.
  // This keeps local/provisional integrations unblocked when provider-side secrets are unavailable.
  if (pocketSecret) {
    const signature = request.headers.get("x-heypocket-signature");
    const timestamp = request.headers.get("x-heypocket-timestamp");

    const isValidSignature = verifyPocketSignature({
      rawBody,
      timestamp,
      signature,
      secret: pocketSecret,
    });

    if (!isValidSignature) {
      if (DEBUG_WEBHOOK) {
        console.warn("[pocket-webhook] Signature check failed", {
          requestId,
          hasTimestamp: Boolean(timestamp),
          hasSignature: Boolean(signature),
        });
      }
      return Response.json({ ok: false, error: "Invalid signature." }, { status: 401 });
    }
  } else {
    console.warn(
      "Pocket webhook signature verification is disabled because POCKET_WEBHOOK_SECRET is not set."
    );
  }

  let payload: PocketPayload;
  try {
    payload = JSON.parse(rawBody) as PocketPayload;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (payload?.event !== POCKET_EVENT) {
    return Response.json({ ok: true, ignored: true }, { status: 200 });
  }

  try {
    const recording = payload?.recording ?? {};
    const title = recording?.title || "Untitled recording";
    const createdAt = recording?.createdAt
      ? new Date(recording.createdAt).toISOString()
      : new Date().toISOString();
    const transcript = Array.isArray(payload?.transcript) ? payload.transcript : [];
    const summaryMarkdown = getPocketMarkdownSummary(payload);

    let structuredMarkdown: string;
    try {
      structuredMarkdown = await generateStructuredMarkdown({
        title,
        summaryMarkdown,
        transcript,
      });
    } catch (error) {
      console.error("[pocket-webhook] Claude request failed", {
        requestId,
        error,
      });
      throw error;
    }

    try {
      await savePocketNoteToNotion({
        title,
        createdAt,
        markdown: structuredMarkdown,
      });
    } catch (error) {
      console.error("[pocket-webhook] Notion request failed", {
        requestId,
        error,
      });
      throw error;
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[pocket-webhook] Processing failed", {
      requestId,
      error,
    });
    return Response.json(
      DEBUG_WEBHOOK
        ? {
            ok: false,
            error: "Internal server error.",
            requestId,
            details: String(error),
          }
        : { ok: false, error: "Internal server error.", requestId },
      { status: 500 }
    );
  }
}
