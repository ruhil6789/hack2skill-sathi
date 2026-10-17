export type Language =
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "bn"
  | "mr"
  | "kn"
  | "ml";

export type JobType = "delivery" | "driver" | "daily_wage" | "other";

export type CompanionMode =
  | "chat"
  | "earnings"
  | "safety"
  | "rights"
  | "documents"
  | "grievance";

export interface WorkerProfile {
  name: string;
  language: Language;
  jobType: JobType;
  city: string;
  platform: string;
}

export interface EarningEntry {
  id: string;
  date: string;
  amount: number;
  hours: number;
  note: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: CompanionMode;
}

export interface WorkerContext {
  profile: WorkerProfile;
  earnings: EarningEntry[];
  lastSafetyTopic?: string;
  lastRightsTopic?: string;
  lastDocumentSummary?: string;
  draftGrievance?: string;
}
