import { NextResponse } from "next/server";
import { cleanReplyText } from "@/lib/format";
import { getGrokClient, getGrokModel } from "@/lib/grok";
import { buildSystemPrompt } from "@/lib/prompts";
import {
  parseMode,
  publicErrorMessage,
  sanitizeContext,
  sanitizeHistory,
  sanitizeMessage,
} from "@/lib/validate";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const message = sanitizeMessage(raw.message);
    const mode = parseMode(raw.mode);
    const context = sanitizeContext(raw.context);
    const history = sanitizeHistory(raw.history);

    const client = getGrokClient();
    const completion = await client.chat.completions.create({
      model: getGrokModel(),
      temperature: 0.5,
      max_tokens: 900,
      messages: [
        { role: "system", content: buildSystemPrompt(mode, context) },
        ...history,
        { role: "user", content: message },
      ],
    });

    const reply = cleanReplyText(
      completion.choices[0]?.message?.content?.trim() ||
        "I could not generate a reply. Please try again.",
    );

    return NextResponse.json({ reply, model: completion.model });
  } catch (err) {
    const { message, status } = publicErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
