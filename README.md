# Clause by Clause

*Every signature is a risk nobody explained.*

A legal-literacy tool for Tamil Nadu residents: paste a clause — or
photograph a whole rental agreement or loan note — and get a
plain-language risk check against Tamil Nadu law for each clause, with
a one-tap way to either draft a counter-message or file a complaint
with your District Legal Services Authority (DLSA).

## What it does

- **Paste text or upload a photo.** A single clause, or a whole
  agreement — the agent finds and classifies every clause it can in
  a photo, not just one.
- **Checks each clause against a static, lawyer-reviewable JSON rule
  base** (not freeform LLM legal reasoning) — Gemini's job is narrow:
  classify which known clause type a passage matches. The legal limit,
  citation, plain-language explanation, and counter-message text all
  come from `rules/rental_tn.json` / `rules/loan_tn.json`.
- **Acts, not just explains.** For any HIGH-risk clause, one tap
  drafts a counter-message to send the other party, or a formal
  complaint pre-filled with the right DLSA office for the person's
  district — sent by email or downloaded to send manually.
- **Handles multiple risky clauses at once.** On a multi-clause photo
  result, there's a bulk option to draft one combined counter-message
  or one combined DLSA complaint covering every flagged clause,
  alongside the per-clause options.
- **Tamil / English toggle.** The whole interface — every button,
  label, and screen — switches between Tamil and English. (The
  AI-generated legal content itself — explanations, citations,
  counter-messages — is still English-only; see *Known limitations*.)
- **Back navigation** on every screen, so people can back out of a
  flow without losing their place.

## Architecture

```
backend/
  main.py              App assembly. Serves the API and the frontend.
  config.py            All env vars and paths, in one place.
  routers/             HTTP layer — parses requests, calls services, returns JSON.
    analyze.py           POST /api/analyze, POST /api/analyze-image
    complaint.py         POST /api/complaint, POST /api/send-complaint
    dlsa.py              GET  /api/dlsa/{district}
  services/            Business logic. No HTTP or LLM leakage between them.
    rules_service.py     Reads rental_tn.json / loan_tn.json / dlsa_tn.json.
    dlsa_service.py      Builds the complaint letter text.
    agent_service.py     Talks to Gemini, orchestrates function-calling.
    email_service.py     Sends the complaint via the Brevo transactional
                          email API (HTTPS, not SMTP — works on hosts
                          that block outbound SMTP ports).
  schemas/             Pydantic request/response contracts.
  rules/, data/        The rule base JSON (sample data included — replace
                       with your verified legal content, same schema,
                       drop-in).

frontend/
  index.html           Single page, plain HTML/CSS/JS (no build step).
  css/style.css        Mobile-first, large touch targets, light/dark theme.
  js/api.js            Fetch wrappers — one function per backend endpoint.
  js/app.js            State machine + one render function per screen.
  js/theme.js           Light/dark toggle.
  js/lang.js            English/Tamil UI dictionary + toggle.
```

Why this split: each service does one job and doesn't know about
HTTP. Routers only translate between HTTP and services. If you swap
Gemini for another model, the JSON rule base for a database, or the
frontend for React later, you touch one layer, not the whole app.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | FastAPI + Uvicorn (Python) |
| AI | Gemini 2.5 Flash, via function-calling only (classification, not legal reasoning) |
| Legal source of truth | Static JSON rule files, one per state + document type |
| Email | Brevo Transactional Email API (HTTPS) |
| Frontend | Vanilla HTML/CSS/JS — no framework, no build step |

## Run it locally

Requires Python 3.10+ and a free [Google AI Studio](https://aistudio.google.com/)
API key.

```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt

cp .env.example .env
# then edit .env:
#   GOOGLE_API_KEY        — required for clause/photo analysis (aistudio.google.com)
#   BREVO_API_KEY          — required to actually send the DLSA complaint email
#   BREVO_SENDER_EMAIL     — must be a sender address you've verified in Brevo
#                            (Settings > Senders, Domains & Dedicated IPs > Senders —
#                            no domain/DNS ownership needed, just click the
#                            verification email)
#   BREVO_SENDER_NAME       — optional, defaults to "Clause by Clause"

uvicorn main:app --reload
```

Open **http://localhost:8000** — the frontend is served from the same
process, so there's nothing else to run.

The server starts fine without `GOOGLE_API_KEY` or the Brevo
variables, but:
- clause/photo analysis will fail (500) without a valid `GOOGLE_API_KEY`
- "Send this email" on the complaint screen will fail without valid
  Brevo credentials — the "Download and send yourself" option still
  works either way

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/analyze` | Check a single pasted clause |
| POST | `/api/analyze-image` | Check every clause found in a photo of a document |
| POST | `/api/complaint` | Draft a DLSA complaint (single clause or combined) |
| POST | `/api/send-complaint` | Send the drafted complaint via Brevo |
| GET | `/api/dlsa/{district}` | Look up the DLSA office for a district |

## Before a real (non-hackathon) demo

- Replace `backend/rules/rental_tn.json`, `backend/rules/loan_tn.json`,
  and `backend/data/dlsa_tn.json` with verified legal content and a
  verified DLSA directory — the sample data here is illustrative, not
  lawyer-checked. Same schema, so it's a straight swap.
- Set a real `GOOGLE_API_KEY` and Brevo credentials before testing the
  full analyze → complaint → send flow.

## Known limitations, honestly

- Scoped to Tamil Nadu, two document types (rental and loan) — by
  design, so every flagged clause stays citable against a real rule.
- Text paste and photo upload only; voice input is on the roadmap,
  not built yet.
- The Tamil/English toggle covers the full interface today. The
  AI-generated legal content (explanations, citations,
  counter-messages) is still English-only — translating that from the
  same rule-file source is the next step, not done yet.
- No persistent case tracking or automatic follow-up reminders — each
  check is a fresh session.
