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
  | "shift"
  | "sos"
  | "safety"
  | "rights"
  | "documents"
  | "templates"
  | "grievance";

export type EarnPlatform =
  | "swiggy"
  | "zomato"
  | "uber"
  | "ola"
  | "rapido"
  | "blinkit"
  | "cash"
  | "other";

export interface WorkerProfile {
  name: string;
  language: Language;
  jobType: JobType;
  city: string;
  platform: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

export interface EarningEntry {
  id: string;
  date: string;
  amount: number;
  hours: number;
  note: string;
  platform: EarnPlatform;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: CompanionMode;
}

export type TemplateKind = "grievance" | "leave" | "customer" | "custom";

export interface SavedTemplate {
  id: string;
  kind: TemplateKind;
  title: string;
  body: string;
  updatedAt: string;
}

export interface WorkerContext {
  profile: WorkerProfile;
  earnings: EarningEntry[];
  templates: SavedTemplate[];
  lastSafetyTopic?: string;
  lastRightsTopic?: string;
  lastDocumentSummary?: string;
  draftGrievance?: string;
  lastShiftAdvice?: string;
}
