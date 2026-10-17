import { LIMITS } from "./constants";

type RecognizeFn = (
  image: File,
  langs: string,
  options?: { logger?: (m: unknown) => void },
) => Promise<{ data: { text: string } }>;

let recognize: RecognizeFn | null = null;
let loading: Promise<RecognizeFn> | null = null;

/**
 * Lazy-load Tesseract once and reuse the recognize entrypoint so each
 * payslip photo does not pay a full cold-start cost.
 */
async function getRecognize(): Promise<RecognizeFn> {
  if (recognize) return recognize;
  if (!loading) {
    loading = import("tesseract.js").then((mod) => {
      recognize = mod.recognize as RecognizeFn;
      return recognize;
    });
  }
  return loading;
}

export async function recognizeDocumentText(file: File): Promise<string> {
  const run = await getRecognize();
  const result = await run(file, "eng", { logger: () => undefined });
  return (result.data.text || "").trim().slice(0, LIMITS.documentChars);
}

/** Test helper */
export function resetOcrCache() {
  recognize = null;
  loading = null;
}
