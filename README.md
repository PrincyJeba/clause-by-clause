# Clause by Clause

A legal-literacy tool for Tamil Nadu residents: paste a clause from a
rental agreement or loan note, get a plain-language risk check against
Tamil Nadu law, and either draft a counter-message or file a complaint
with your District Legal Services Authority.

## Architecture

```
backend/
  main.py            App assembly. Serves the API and the frontend.
  config.py          All env vars and paths, in one place.
  routers/           HTTP layer — parses requests, calls services, returns JSON.
    analyze.py         POST /api/analyze
    complaint.py        POST /api/complaint, POST /api/send-complaint
    dlsa.py               GET  /api/dlsa/{district}
  services/          Business logic. No HTTP or LLM leakage between them.
    rules_service.py    Reads rental_tn.json / loan_tn.json / dlsa_tn.json.
    dlsa_service.py       Builds the complaint letter text.
    agent_service.py       Talks to Gemini, orchestrates tool calls.
    email_service.py        Sends the complaint via Gmail SMTP.
  schemas/            Pydantic request/response contracts.
  rules/, data/       Your rule base JSON (sample data included — replace
                      with your real files, same schema, drop-in).

frontend/
  index.html          Single page, plain HTML/CSS/JS (no build step).
  css/style.css        Mobile-first, large touch targets.
  js/api.js             Fetch wrappers — one function per backend endpoint.
  js/app.js               State + one render function per screen.
```

Why this split: each service does one job and doesn't know about HTTP.
Routers only translate between HTTP and services. If you swap Gemini for
another model, or the JSON rule base for a database, or the frontend for
React later, you touch one layer, not the whole app.

## Run it

```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env
# edit .env: add your GOOGLE_API_KEY (free at aistudio.google.com)
#            add GMAIL_USER / GMAIL_APP_PASSWORD if you want email sending to work

uvicorn main:app --reload
```

Open http://localhost:8000 — the frontend is served from the same
process, so there's nothing else to run.

## Before your real demo

- Replace `backend/rules/rental_tn.json`, `backend/rules/loan_tn.json`,
  and `backend/data/dlsa_tn.json` with your actual rule base and DLSA
  directory — the sample data here is illustrative, not verified legal
  content. Same schema, so it's a straight swap.
- Set a real `GOOGLE_API_KEY` before testing the analyze flow — it's a
  hard dependency, the app will fail to start without one.
