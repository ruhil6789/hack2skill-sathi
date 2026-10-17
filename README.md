# Saathi — Gig Worker Companion

Generative AI companion for informal and gig workers (delivery partners, drivers, daily-wage workers). Uses the **Groq** OpenAI-compatible API for chat + Whisper voice.

## Problem alignment

Connected workflows (evaluated as a whole, not isolated features):

| Need | How Saathi covers it |
|------|----------------------|
| Multilingual guidance | Profile language → replies + Whisper language |
| Earnings tracking | Log pay → ask AI → escalate underpayment to grievance |
| Safety practices | Job-specific checklists into conversation context |
| Rights & welfare | e-SHRAM / schemes, tied to job type |
| Document help | Paste notice → plain-language explain → dispute path |
| Grievance drafting | Uses profile + earnings + docs context |

## Engineering parameters

- **Code quality** — typed domain models, shared validators, thin API routes
- **Security** — input allowlists, size limits, sanitized client errors (no key leakage)
- **Efficiency** — truncated history/docs, `max_tokens`, abortable fetches
- **Testing** — Vitest unit tests for formatting + validation
- **Accessibility** — labels, live regions, focus rings, `aria-current` / `aria-pressed`
- **Problem statement alignment** — one companion with linked tool → chat → grievance flows

## Setup

```bash
# .env already supports: XAI_API_KEY=gsk_...
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Open companion**.

```bash
npm test
npm run build
```

### Environment

| Variable      | Required | Description |
|---------------|----------|-------------|
| `XAI_API_KEY` | Yes      | Groq API key (`gsk_…`) |
| `XAI_MODEL`   | No       | Default `qwen/qwen3.8-27b` |
