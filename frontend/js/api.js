// Thin wrapper around fetch. Every backend call lives here so app.js
// never constructs a URL or reads a Response body directly.

const API_BASE = "/api";

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Request to ${path} failed: ${detail}`);
  }
  return res.json();
}

const Api = {
  analyzeClause: (clause_text, doc_type, district) =>
    postJSON("/analyze", { clause_text, doc_type, district }),

  createComplaint: (payload) => postJSON("/complaint", payload),

  sendComplaint: (payload) => postJSON("/send-complaint", payload),

  getDlsaOffice: async (district) => {
    const res = await fetch(`${API_BASE}/dlsa/${encodeURIComponent(district)}`);
    if (!res.ok) throw new Error("Could not fetch DLSA office details");
    return res.json();
  },
};
