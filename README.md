# Clause by Clause

**Every signature is a risk nobody explained.**

An agentic AI for vernacular legal and contract literacy in Tamil Nadu.
Reads your contract clause, checks it against Tamil Nadu law, and acts on it —
drafting a counter-message or sending a complaint to free legal aid (DLSA).

## What It Does

1. User pastes a clause from a rental agreement or loan note
2. Agent checks it against Tamil Nadu Buildings Act 1960 / Money Lenders Act 1957
3. If high risk: user chooses to send a counter-message OR report to DLSA
4. For DLSA path: agent drafts a formal complaint and sends the email

## Tech Stack

- Streamlit (frontend + hosting)
- OpenAI API with tool-calling (agent loop)
- Structured JSON rule base (Tamil Nadu laws)
- smtplib via Gmail (email sending)
- Web Speech API (voice input, browser-native)

## Run Locally

1. Clone the repo
   git clone https://github.com/YOUR_USERNAME/clause-by-clause.git
   cd clause-by-clause

2. Install dependencies
   pip install -r requirements.txt

3. Set up environment variables
   Copy .env.example to .env and fill in your values:
   - OPENAI_API_KEY: your OpenAI API key
   - GMAIL_USER: your Gmail address
   - GMAIL_APP_PASSWORD: 16-character Gmail App Password
     (Generate at myaccount.google.com > Security > App Passwords)

4. Run the app
   streamlit run app.py

## Legal Scope

- Document types: Rental Agreements, Informal Loan Notes
- State: Tamil Nadu
- Laws: TN Buildings (Lease and Rent Control) Act 1960,
         TN Money Lenders Act 1957, Indian Contract Act 1872
- Legal aid: Tamil Nadu State Legal Services Authority (TNSLA)
- Free helpline: 15100

## Disclaimer

This tool is not a substitute for legal advice.
For serious or complex situations, contact your nearest DLSA
or call the free legal aid helpline: 15100.

## Hackathon

Meesho ScriptedBy Her 2.0 - 2026
Theme: Building for Bharat with the Power of Agentic AI
Submitted by: Jeba Princy J, Thiagarajar College of Engineering, Madurai