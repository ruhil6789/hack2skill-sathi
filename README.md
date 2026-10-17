# Saathi — Gig Worker Companion

Generative AI companion for informal and gig workers (delivery partners, drivers, daily-wage workers). Uses the **Groq** OpenAI-compatible API for chat + Whisper voice.

## Problem alignment

Connected workflows (evaluated as a whole, not isolated features):

| Need | How Saathi covers it |
|------|----------------------|
| Multilingual guidance | Profile language → replies + Whisper language |
| Earnings tracking | Multi-platform ledger (Swiggy/Uber/cash…) + weekly compare |
| Safety practices | Checklists + **SOS pack** (location, call, steps) |
| Rights & welfare | e-SHRAM / schemes + **offline cheat sheets** |
| Document help | Paste or **photo OCR** → explain → dispute |
| Grievance drafting | Drafts + **saved templates** (leave/customer too) |
| Shift decisions | **Shift planner** with earnings + weather/peak hints |

## Engineering parameters

- **Code quality** — typed domain models, shared validators, thin API routes
- **Security** — input allowlists, size limits, sanitized client errors (no key leakage)
- **Efficiency** — mode-scoped prompts + `max_tokens`, truncated history/docs/earnings, weather cache (~20 min), abortable fetches, lazy/reused OCR, lighter VAD
- **Testing** — Vitest unit + API route mocks (validate, format, prompts, platforms, storage, weather, chat/transcribe)
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
