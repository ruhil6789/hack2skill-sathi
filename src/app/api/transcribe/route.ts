import { NextResponse } from "next/server";
import { getGrokClient } from "@/lib/grok";
import {
  assertAudioFile,
  parseLanguage,
  publicErrorMessage,
  ValidationError,
} from "@/lib/validate";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const language = parseLanguage(form.get("language"));

    if (!(file instanceof File)) {
      throw new ValidationError("Audio file is required.");
    }
    assertAudioFile(file);

    const client = getGrokClient();
    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language,
      response_format: "json",
      temperature: 0,
    });

    const text = transcription.text?.trim();
    if (!text) {
      throw new ValidationError("Could not hear anything. Please try again.", 422);
    }

    return NextResponse.json({ text });
  } catch (err) {
    const { message, status } = publicErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
