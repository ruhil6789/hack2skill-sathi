import type { JobType } from "./types";

export interface CheatCard {
  id: string;
  category: "safety" | "rights";
  title: string;
  bullets: string[];
}

const KEY = "saathi-cheats-v1";

const BASE_SAFETY: CheatCard[] = [
  {
    id: "s-helmet",
    category: "safety",
    title: "On the road",
    bullets: [
      "Wear a fastened helmet / seatbelt every trip.",
      "Keep phone mounted — no texting while moving.",
      "If tired, take a 10-minute break before the next order.",
    ],
  },
  {
    id: "s-night",
    category: "safety",
    title: "Night shifts",
    bullets: [
      "Share live location with a trusted contact.",
      "Prefer well-lit pickup / drop points.",
      "Trust your gut — cancel and move if a spot feels unsafe.",
    ],
  },
  {
    id: "s-cash",
    category: "safety",
    title: "Cash & payments",
    bullets: [
      "Prefer UPI; avoid carrying large cash.",
      "Confirm amount on the app before leaving.",
      "Screenshot payment proof for disputes.",
    ],
  },
];

const BASE_RIGHTS: CheatCard[] = [
  {
    id: "r-eshram",
    category: "rights",
    title: "e-SHRAM basics",
    bullets: [
      "Free registration for unorganised workers with Aadhaar.",
      "Helps access social security and accident benefits.",
      "Keep your UAN / registration number saved offline.",
    ],
  },
  {
    id: "r-pay",
    category: "rights",
    title: "Pay disputes",
    bullets: [
      "Log date, order ID, expected vs paid amount.",
      "Raise in-app ticket first; keep screenshots.",
      "Escalate to labour helpline if unresolved.",
    ],
  },
  {
    id: "r-accident",
    category: "rights",
    title: "After an accident",
    bullets: [
      "Get medical help first; keep bills.",
      "Inform platform support and emergency contact.",
      "Note time, place, and witnesses.",
    ],
  },
];

const JOB_EXTRA: Partial<Record<JobType, CheatCard[]>> = {
  delivery: [
    {
      id: "s-delivery",
      category: "safety",
      title: "Delivery handoff",
      bullets: [
        "Wait in public view; avoid entering unknown buildings alone at night.",
        "Confirm order code before handing over.",
        "Report harassment via in-app safety tools immediately.",
      ],
    },
  ],
  driver: [
    {
      id: "s-driver",
      category: "safety",
      title: "Passenger trips",
      bullets: [
        "Verify trip details before starting.",
        "Share trip with family for late-night rides.",
        "Do not accept off-app cash deals that feel risky.",
      ],
    },
  ],
  daily_wage: [
    {
      id: "s-site",
      category: "safety",
      title: "Worksite",
      bullets: [
        "Ask for PPE (helmet, gloves, boots) before starting.",
        "Drink water often in heat; rest in shade.",
        "Refuse clearly unsafe work; note the contractor name.",
      ],
    },
  ],
};

export function getCheatSheets(jobType: JobType): CheatCard[] {
  return [...BASE_SAFETY, ...(JOB_EXTRA[jobType] || []), ...BASE_RIGHTS];
}

export function cacheCheatSheets(jobType: JobType) {
  if (typeof window === "undefined") return;
  const cards = getCheatSheets(jobType);
  localStorage.setItem(
    KEY,
    JSON.stringify({ jobType, cards, cachedAt: new Date().toISOString() }),
  );
}

export function loadCachedCheatSheets(): {
  jobType: JobType;
  cards: CheatCard[];
  cachedAt: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      jobType: JobType;
      cards: CheatCard[];
      cachedAt: string;
    };
  } catch {
    return null;
  }
}
