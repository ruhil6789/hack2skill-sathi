import OpenAI from "openai";

/**
 * Uses the Groq OpenAI-compatible API.
 * Keys starting with `gsk_` are Groq keys (https://console.groq.com/).
 * Env: XAI_API_KEY or GROQ_API_KEY (either works).
 */
export function getGrokClient() {
  const apiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing API key. Set XAI_API_KEY (or GROQ_API_KEY) in .env",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export function getGrokModel() {
  // Strong multilingual default for Hindi/Tamil/etc. Override with XAI_MODEL.
  return process.env.XAI_MODEL || "qwen/qwen3.8-27b";
}
