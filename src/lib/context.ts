import { LIMITS } from "./constants";
import type { CompanionMode, WorkerContext } from "./types";

/**
 * Shrink worker context before it is sent to / serialized for the LLM.
 * Keeps only fields that matter for the active mode to cut tokens + bandwidth.
 */
export function trimContextForMode(
  mode: CompanionMode,
  ctx: WorkerContext,
): WorkerContext {
  const earnings = ctx.earnings.slice(0, LIMITS.earningsEntriesInPrompt);
  const profile = ctx.profile;
  const empty: WorkerContext = {
    profile,
    earnings,
    templates: [],
  };

  switch (mode) {
    case "earnings":
      return empty;
    case "shift":
      return {
        ...empty,
        lastShiftAdvice: ctx.lastShiftAdvice?.slice(0, 400),
      };
    case "sos":
    case "safety":
      return {
        ...empty,
        lastSafetyTopic: ctx.lastSafetyTopic,
      };
    case "rights":
      return {
        ...empty,
        lastRightsTopic: ctx.lastRightsTopic,
      };
    case "documents":
      return {
        ...empty,
        lastDocumentSummary: ctx.lastDocumentSummary,
      };
    case "templates":
      return empty;
    case "grievance":
      return {
        ...empty,
        draftGrievance: ctx.draftGrievance,
        lastDocumentSummary: ctx.lastDocumentSummary,
      };
    default:
      return {
        ...empty,
        lastSafetyTopic: ctx.lastSafetyTopic,
        lastRightsTopic: ctx.lastRightsTopic,
        lastDocumentSummary: ctx.lastDocumentSummary,
        draftGrievance: ctx.draftGrievance?.slice(0, 500),
        lastShiftAdvice: ctx.lastShiftAdvice?.slice(0, 400),
      };
  }
}
