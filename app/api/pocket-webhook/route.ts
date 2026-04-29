import { createHmac, timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { savePocketNoteToNotion } from "@/lib/notion";
import { NOTE_TEMPLATES, NoteType, getNotionDatabaseId } from "@/lib/pocket-note-types";

const POCKET_EVENT = "summary.completed";
const ANTHROPIC_MODEL = "claude-opus-4-5";
const DEBUG_WEBHOOK = process.env.POCKET_WEBHOOK_DEBUG === "true";
const POCKET_SUMMARY_WAIT_MS = Number.parseInt(process.env.POCKET_SUMMARY_WAIT_MS ?? "20000", 10);

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

function extractFirstSentence(transcript: PocketTranscriptEntry[]): string {
  const firstText = transcript[0]?.text?.trim() ?? "";
  const match = firstText.match(/^.{10,200}?[.?!]/);
  return match ? match[0] : firstText.slice(0, 200);
}

function buildClassificationMenu(): string {
  return Object.entries(NOTE_TEMPLATES)
    .map(([key, template]) => `- **${key}** (${template.label}): ${template.signals}`)
    .join("\n");
}

function buildSectionInstructions(type: NoteType): string {
  const template = NOTE_TEMPLATES[type] ?? NOTE_TEMPLATES.general;
  const allSections = [...template.sections, "## Raw transcript"];
  return allSections
    .map((section) => {
      const guidance = template.sectionGuidance?.[section];
      return guidance ? `${section}\n  -> ${guidance}` : section;
    })
    .join("\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseClaudeOutput(raw: string): { noteType: NoteType; markdown: string } {
  const lines = raw.split("\n");
  const scanWindow = Math.min(lines.length, 12);
  let noteType: NoteType = "general";
  let noteTypeLineIndex = -1;

  for (let i = 0; i < scanWindow; i += 1) {
    const line = lines[i]?.trim() ?? "";
    // Accept strict and mildly formatted variants:
    // NOTE_TYPE: course
    // **NOTE_TYPE:** "course"
    const match = line.match(/\**\s*NOTE_TYPE\s*:?\s*\**\s*["'`]?([a-z_]+)["'`]?\s*$/i);
    if (!match) continue;

    const candidate = match[1]?.toLowerCase() as NoteType | undefined;
    if (candidate && candidate in NOTE_TEMPLATES) {
      noteType = candidate;
      noteTypeLineIndex = i;
      break;
    }
  }

  const markdownStartIndex = noteTypeLineIndex >= 0 ? noteTypeLineIndex + 1 : 0;
  const markdown = lines.slice(markdownStartIndex).join("\n").trim();

  if (DEBUG_WEBHOOK && noteType === "general") {
    console.warn("[pocket-webhook] Falling back to general note type", {
      preview: lines.slice(0, 5).join("\n"),
    });
  }

  return { noteType, markdown };
}

async function generateStructuredMarkdown({
  title,
  summaryMarkdown,
  transcript,
}: {
  title: string;
  summaryMarkdown: string;
  transcript: PocketTranscriptEntry[];
}): Promise<{ noteType: NoteType; markdown: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const anthropic = new Anthropic({ apiKey });
  const firstSentence = extractFirstSentence(transcript);
  const prompt = [
    "You are processing a voice note. Complete both parts below.",
    "",
    "--------------------------------",
    "PART 1 - CLASSIFY",
    "--------------------------------",
    "",
    "Choose one note type based on the title and first sentence.",
    "Available types:",
    "",
    buildClassificationMenu(),
    "",
    `Title: "${title || "Untitled recording"}"`,
    `First sentence: "${firstSentence}"`,
    "",
    "Output your choice on the very first line of your response, exactly as:",
    "NOTE_TYPE: <type_key>",
    "(No other text on that line.)",
    "",
    "--------------------------------",
    "PART 2 - WRITE THE NOTE",
    "--------------------------------",
    "",
    "After the NOTE_TYPE line, write the structured note.",
    "Use the section list for your chosen type (shown below).",
    "Follow the order exactly. Do not add, rename, or merge sections.",
    "",
    "Rules:",
    "- Tight, useful bullets. No filler or padding.",
    "- Empty section? Write '- None.' - never skip the header.",
    "- Under '## Raw transcript': preserve speaker/time ordering faithfully.",
    "- The Pocket summary below is INPUT CONTEXT only - do not output it as a section.",
    "",
    "Section lists by type:",
    ...Object.entries(NOTE_TEMPLATES).map(([key]) => {
      const sections = buildSectionInstructions(key as NoteType).replace(/\n/g, " | ");
      return `  ${key}: ${sections}`;
    }),
    "",
    "--------------------------------",
    "INPUT DATA",
    "--------------------------------",
    "",
    "Pocket summary (context only):",
    summaryMarkdown || "No Pocket summary available.",
    "",
    "Full transcript:",
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

  return parseClaudeOutput(textContent);
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
    let summaryMarkdown = getPocketMarkdownSummary(payload);
    if (!summaryMarkdown && POCKET_SUMMARY_WAIT_MS > 0) {
      // Pocket can emit webhook events before summary is consistently present.
      // Delay processing briefly to improve odds in eventual consistency scenarios.
      await sleep(POCKET_SUMMARY_WAIT_MS);
      summaryMarkdown = getPocketMarkdownSummary(payload);
    }

    let noteType: NoteType = "general";
    let structuredMarkdown: string;
    try {
      const generated = await generateStructuredMarkdown({
        title,
        summaryMarkdown,
        transcript,
      });
      noteType = generated.noteType;
      structuredMarkdown = generated.markdown;
    } catch (error) {
      console.error("[pocket-webhook] Claude request failed", {
        requestId,
        error,
      });
      throw error;
    }

    const notionDatabaseId = getNotionDatabaseId(noteType);
    console.info("[pocket-webhook] Classified", { requestId, noteType, notionDatabaseId });

    try {
      await savePocketNoteToNotion({
        title,
        createdAt,
        markdown: structuredMarkdown,
        notionDatabaseId,
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
