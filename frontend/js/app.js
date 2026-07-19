// Simple state machine, one render function per screen. No framework —
// deliberate, given the time budget. If this grows, the render*()
// functions map 1:1 onto what would become React components later.

const DISTRICTS = [
  "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli",
  "Erode", "Vellore", "Tiruppur", "Thanjavur", "Kancheepuram", "Cuddalore", "Other",
];

const SAMPLES = {
  rental:
    "The tenant shall pay 6 months rent as advance security deposit. The deposit " +
    "shall be forfeited entirely if the tenant vacates before completing 12 months. " +
    "The landlord reserves the right to increase rent by 20 percent annually without " +
    "notice or Rent Controller approval.",
  loan:
    "The borrower agrees to pay interest at 36 percent per annum, compounded monthly. " +
    "In case of default exceeding 7 days, the lender has the right to seize the " +
    "borrower's household items and mobile phone as collateral without requiring a court order.",
};

const state = {
  screen: "input",
  inputMode: "text", // "text" | "image"
  docType: "rental",
  district: "Chennai",
  clauseText: "",
  result: {},
  imageBase64: null,
  imageMimeType: null,
  imagePreviewUrl: null,
  imageClauses: [],
  imageSummary: null,
  selectedClauseIndex: null, // which imageClauses[] entry is "active" for counter/DLSA screens
  complaintData: {},
  userName: "",
  userEmail: "",
  sendResult: null,
};

const root = document.getElementById("app-main");

function reset() {
  Object.assign(state, {
    screen: "input",
    clauseText: "",
    result: {},
    imageBase64: null,
    imageMimeType: null,
    imagePreviewUrl: null,
    imageClauses: [],
    imageSummary: null,
    selectedClauseIndex: null,
    complaintData: {},
    userName: "",
    userEmail: "",
    sendResult: null,
  });
  render();
}

// Returns the clause data currently in play, whether we're in single-clause
// (pasted text) mode or looking at one clause picked from an image result.
function activeClause() {
  return state.selectedClauseIndex !== null
    ? state.imageClauses[state.selectedClauseIndex]
    : state.result;
}

function activeClauseText() {
  return state.selectedClauseIndex !== null
    ? state.imageClauses[state.selectedClauseIndex].clause_text || ""
    : state.clauseText;
}

// Where "go back" / "check another clause" should return to, depending on
// whether the current flow started from pasted text or an uploaded photo.
function resultScreenName() {
  return state.selectedClauseIndex !== null ? "imageResult" : "result";
}

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function render() {
  const screens = {
    input: renderInput,
    result: renderResult,
    imageResult: renderImageResult,
    counter: renderCounter,
    dlsaForm: renderDlsaForm,
    emailPreview: renderEmailPreview,
    confirmation: renderConfirmation,
  };
  root.innerHTML = "";
  screens[state.screen]();
}

// ---- Screen 1: Input --------------------------------------------------

function renderInput() {
  const districtOptions = DISTRICTS.map(
    (d) => `<option value="${d}" ${d === state.district ? "selected" : ""}>${d}</option>`
  ).join("");

  const isImage = state.inputMode === "image";

  root.innerHTML = `
    <h2>Check your agreement</h2>
    <p class="muted">Paste a clause, or upload a photo of the whole document.
    We'll check it against Tamil Nadu law and tell you plainly what it means.</p>

    <div class="btn-row" role="tablist">
      <button class="${isImage ? "btn-outline" : "btn-primary"}" id="modeText" type="button">Paste text</button>
      <button class="${isImage ? "btn-primary" : "btn-outline"}" id="modeImage" type="button">Upload photo</button>
    </div>

    <div class="row" style="margin-top:1rem">
      <div>
        <label for="docType">Document type</label>
        <select id="docType">
          <option value="rental" ${state.docType === "rental" ? "selected" : ""}>Rental agreement</option>
          <option value="loan" ${state.docType === "loan" ? "selected" : ""}>Loan / borrowing note</option>
        </select>
      </div>
      <div>
        <label for="district">Your district</label>
        <select id="district">${districtOptions}</select>
      </div>
    </div>

    <div id="modeBody"></div>

    <button class="btn-primary" id="analyzeBtn">${isImage ? "Check this document" : "Check this clause"}</button>
    <div id="analyzeStatus"></div>

    <div class="disclaimer">
      This tool is not a substitute for legal advice. For serious or urgent
      situations, contact your nearest District Legal Services Authority or
      call the free Tamil Nadu legal aid helpline: 15100.
    </div>
  `;

  document.getElementById("docType").onchange = (e) => (state.docType = e.target.value);
  document.getElementById("district").onchange = (e) => (state.district = e.target.value);
  document.getElementById("modeText").onclick = () => {
    state.inputMode = "text";
    render();
  };
  document.getElementById("modeImage").onclick = () => {
    state.inputMode = "image";
    render();
  };

  isImage ? renderImageInputBody() : renderTextInputBody();

  document.getElementById("analyzeBtn").onclick = isImage ? runImageAnalysis : runTextAnalysis;
}

function renderTextInputBody() {
  const body = document.getElementById("modeBody");
  body.innerHTML = `
    <label for="clauseText">Paste your clause here</label>
    <textarea id="clauseText" placeholder="Example: The tenant shall pay 6 months rent as security deposit...">${esc(state.clauseText)}</textarea>

    <details class="samples">
      <summary>Try a sample clause</summary>
      <div class="btn-row">
        <button class="btn-outline" id="sampleRental">Load rental sample</button>
        <button class="btn-outline" id="sampleLoan">Load loan sample</button>
      </div>
    </details>
  `;

  document.getElementById("clauseText").oninput = (e) => (state.clauseText = e.target.value);
  document.getElementById("sampleRental").onclick = () => {
    state.docType = "rental";
    state.clauseText = SAMPLES.rental;
    render();
  };
  document.getElementById("sampleLoan").onclick = () => {
    state.docType = "loan";
    state.clauseText = SAMPLES.loan;
    render();
  };
}

function renderImageInputBody() {
  const body = document.getElementById("modeBody");
  body.innerHTML = `
    <label for="imageInput">Photo of your document</label>
    <input type="file" id="imageInput" accept="image/*" capture="environment" />
    <p class="muted" style="font-size:0.85rem">Tap to take a photo or choose one from your gallery.
    Make sure the text is readable — good lighting, not too angled.</p>
    <div id="imagePreviewWrap"></div>
  `;

  if (state.imagePreviewUrl) {
    document.getElementById("imagePreviewWrap").innerHTML = `
      <img src="${state.imagePreviewUrl}" alt="Selected document photo"
        style="width:100%;border-radius:10px;margin-top:0.6rem;border:1.5px solid var(--border);" />
    `;
  }

  document.getElementById("imageInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.imageMimeType = file.type || "image/jpeg";

    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is "data:image/jpeg;base64,AAAA..." — keep only the payload
      state.imageBase64 = reader.result.split(",")[1];
      state.imagePreviewUrl = reader.result;
      render();
    };
    reader.readAsDataURL(file);
  };
}

async function runTextAnalysis() {
  const text = state.clauseText.trim();
  if (!text) {
    document.getElementById("analyzeStatus").innerHTML =
      '<p class="panel error">Please enter a clause first.</p>';
    return;
  }
  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  document.getElementById("analyzeStatus").innerHTML =
    '<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> Checking against Tamil Nadu law...</div>';

  try {
    const result = await Api.analyzeClause(text, state.docType, state.district);
    state.result = result;
    state.selectedClauseIndex = null;
    state.screen = "result";
    render();
  } catch (err) {
    document.getElementById("analyzeStatus").innerHTML =
      `<p class="panel error">Something went wrong: ${esc(err.message)}</p>`;
    btn.disabled = false;
  }
}

async function runImageAnalysis() {
  if (!state.imageBase64) {
    document.getElementById("analyzeStatus").innerHTML =
      '<p class="panel error">Please choose a photo first.</p>';
    return;
  }
  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  document.getElementById("analyzeStatus").innerHTML =
    '<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> Reading the document and checking every clause — this can take a bit longer...</div>';

  try {
    const result = await Api.analyzeImage(
      state.imageBase64,
      state.imageMimeType,
      state.docType,
      state.district
    );
    if (result.error) {
      document.getElementById("analyzeStatus").innerHTML =
        `<p class="panel error">${esc(result.error)}</p>`;
      btn.disabled = false;
      return;
    }
    state.imageClauses = result.clauses || [];
    state.imageSummary = result.summary;
    state.screen = "imageResult";
    render();
  } catch (err) {
    document.getElementById("analyzeStatus").innerHTML =
      `<p class="panel error">Something went wrong: ${esc(err.message)}</p>`;
    btn.disabled = false;
  }
}

// ---- Screen 2: Result ---------------------------------------------------

function renderResult() {
  const r = state.result;

  if (r.error) {
    root.innerHTML = `
      <h2>Something went wrong</h2>
      <p class="panel error">${esc(r.error)}</p>
      <button class="btn-primary" id="retry">Try again</button>
    `;
    document.getElementById("retry").onclick = reset;
    return;
  }

  if (r.risk_level === "HIGH") {
    root.innerHTML = `
      <span class="stamp high">High risk</span>
      <p>This clause appears to violate Tamil Nadu law.</p>

      ${r.plain_explanation ? `
        <h2>What this means for you</h2>
        <div class="panel explain">${esc(r.plain_explanation)}</div>
      ` : ""}

      ${r.legal_citation ? `<div class="panel citation">Legal basis: ${esc(r.legal_citation)}</div>` : ""}
      ${r.legal_limit ? `<div class="panel citation">What the law allows: ${esc(r.legal_limit)}</div>` : ""}

      <h2>What do you want to do?</h2>
      <p class="muted"><strong>Option A</strong> — send a counter-message to your landlord or lender.</p>
      <button class="btn-primary" id="toCounter">Send counter-message</button>

      <p class="muted" style="margin-top:1rem"><strong>Option B</strong> — report to free legal aid (DLSA).</p>
      <button class="btn-gold" id="toDlsa">Report to DLSA</button>

      <div class="disclaimer">
        This is not legal advice. For complex or urgent situations, contact
        your nearest DLSA or call the free helpline: 15100.
      </div>
    `;
    document.getElementById("toCounter").onclick = () => {
      state.screen = "counter";
      render();
    };
    document.getElementById("toDlsa").onclick = () => {
      state.screen = "dlsaForm";
      render();
    };
  } else {
    root.innerHTML = `
      <span class="stamp low">Standard clause</span>
      <p>No major legal violations were detected in this clause.</p>

      ${r.plain_explanation ? `
        <h2>What this means</h2>
        <div class="panel explain">${esc(r.plain_explanation)}</div>
      ` : ""}
      ${r.legal_citation ? `<div class="panel citation">Reference: ${esc(r.legal_citation)}</div>` : ""}
      ${r.summary ? `<p>${esc(r.summary)}</p>` : ""}

      <p class="muted">If something still feels wrong, or wasn't covered here,
      call the free Tamil Nadu legal aid helpline: <strong>15100</strong>.</p>

      <button class="btn-primary" id="another">Check another clause</button>
    `;
    document.getElementById("another").onclick = reset;
  }
}

// ---- Screen 2b: Image result — a list of every clause found -------------

function renderImageResult() {
  const clauses = state.imageClauses;

  if (!clauses.length) {
    root.innerHTML = `
      <h2>No clauses found</h2>
      <p class="panel error">
        We couldn't confidently match any clauses in this photo to our rule base.
        Try a clearer photo — good lighting, the page flat and not angled — or
        paste the text instead.
      </p>
      ${state.imageSummary ? `<p class="muted">${esc(state.imageSummary)}</p>` : ""}
      <button class="btn-primary" id="another">Try again</button>
    `;
    document.getElementById("another").onclick = reset;
    return;
  }

  const highCount = clauses.filter((c) => c.risk_level === "HIGH").length;

  const cards = clauses
    .map((c, i) => {
      const isHigh = c.risk_level === "HIGH";
      return `
        <div class="panel ${isHigh ? "explain" : "confirm"}" style="border-left-color: ${isHigh ? "var(--red)" : "var(--green)"}">
          <span class="stamp ${isHigh ? "high" : "low"}" style="font-size:0.8rem; padding:0.35rem 0.7rem; margin-bottom:0.5rem;">
            ${isHigh ? "High risk" : "Standard"}
          </span>
          <p style="font-weight:600; margin-top:0.3rem;">${esc(prettyClauseType(c.clause_type))}</p>
          ${c.clause_text ? `<p class="muted" style="font-size:0.85rem; font-style:italic;">"${esc(truncate(c.clause_text, 140))}"</p>` : ""}
          ${c.plain_explanation ? `<p style="font-size:0.92rem;">${esc(c.plain_explanation)}</p>` : ""}
          ${c.legal_citation ? `<p class="muted" style="font-size:0.82rem;">Legal basis: ${esc(c.legal_citation)}</p>` : ""}
          ${isHigh ? `
            <div class="btn-row">
              <button class="btn-primary" data-action="counter" data-index="${i}">Counter-message</button>
              <button class="btn-gold" data-action="dlsa" data-index="${i}">Report to DLSA</button>
            </div>
          ` : ""}
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    <h2>${clauses.length} clause${clauses.length > 1 ? "s" : ""} found</h2>
    <p class="muted">${highCount > 0
      ? `${highCount} of them appear to violate Tamil Nadu law.`
      : "None of them appear to violate Tamil Nadu law."}</p>
    ${state.imageSummary ? `<div class="panel citation">${esc(state.imageSummary)}</div>` : ""}

    ${cards}

    <button class="btn-primary" id="another" style="margin-top:1rem">Check another document</button>

    <div class="disclaimer">
      This is not legal advice. For complex or urgent situations, contact
      your nearest DLSA or call the free helpline: 15100.
    </div>
  `;

  root.querySelectorAll('[data-action="counter"]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedClauseIndex = parseInt(btn.dataset.index, 10);
      state.screen = "counter";
      render();
    };
  });
  root.querySelectorAll('[data-action="dlsa"]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedClauseIndex = parseInt(btn.dataset.index, 10);
      state.screen = "dlsaForm";
      render();
    };
  });
  document.getElementById("another").onclick = reset;
}

function prettyClauseType(type) {
  if (!type) return "Clause";
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max).trim() + "…" : str;
}

// ---- Screen 3: Counter-message ------------------------------------------

function renderCounter() {
  const msg = (activeClause().counter_message) || "";
  root.innerHTML = `
    <h2>Counter-message</h2>
    <p class="muted">Drafted based on Tamil Nadu law. Edit it before sending via
    WhatsApp, SMS, or in person.</p>

    <textarea id="counterText" style="min-height:200px">${esc(msg)}</textarea>

    <div class="btn-row">
      <button class="btn-outline" id="copyBtn">Copy text</button>
      <button class="btn-outline" id="downloadBtn">Download</button>
    </div>

    <p class="muted" style="margin-top:1rem">If the other party refuses to change
    this clause, you can escalate to free legal aid.</p>

    <div class="btn-row">
      <button class="btn-gold" id="toDlsa">Escalate to DLSA</button>
      <button class="btn-text" id="another">Check another clause</button>
    </div>

    <div class="helpline">Free Legal Aid Helpline: 15100</div>
  `;

  document.getElementById("copyBtn").onclick = async () => {
    await navigator.clipboard.writeText(document.getElementById("counterText").value);
    document.getElementById("copyBtn").textContent = "Copied";
    setTimeout(() => (document.getElementById("copyBtn").textContent = "Copy text"), 1200);
  };
  document.getElementById("downloadBtn").onclick = () => {
    downloadText(document.getElementById("counterText").value, "counter_message.txt");
  };
  document.getElementById("toDlsa").onclick = () => {
    state.screen = "dlsaForm";
    render();
  };
  document.getElementById("another").onclick = reset;
}

// ---- Screen 4: DLSA form -------------------------------------------------

function renderDlsaForm() {
  root.innerHTML = `
    <h2>Report to free legal aid</h2>
    <p class="muted">A formal complaint will be drafted for the DLSA office in
    your district.</p>
    <div id="dlsaInfo" class="panel dlsa">Loading office details…</div>

    <label for="userName">Your full name</label>
    <input type="text" id="userName" value="${esc(state.userName)}" placeholder="As it should appear in the complaint" />

    <label for="userEmail">Your email address</label>
    <input type="email" id="userEmail" value="${esc(state.userEmail)}" placeholder="You'll get a copy of the complaint here" />
    <p class="muted" style="font-size:0.85rem">Used only to send you a copy. Not stored or shared.</p>

    <button class="btn-primary" id="draftBtn">Draft the complaint email</button>
    <div id="dlsaStatus"></div>
    <button class="btn-text" id="back">Go back</button>
  `;

  Api.getDlsaOffice(state.district)
    .then((office) => {
      document.getElementById("dlsaInfo").innerHTML = `
        <strong>${esc(office.office)}</strong><br>
        Address: ${esc(office.address)}<br>
        Phone: ${esc(office.phone)}
      `;
    })
    .catch(() => {
      document.getElementById("dlsaInfo").textContent =
        "Could not load office details, but you can still continue.";
    });

  document.getElementById("back").onclick = () => {
    state.screen = resultScreenName();
    render();
  };

  document.getElementById("draftBtn").onclick = async () => {
    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const status = document.getElementById("dlsaStatus");

    if (!name) return (status.innerHTML = '<p class="panel error">Please enter your name.</p>');
    if (!email || !email.includes("@"))
      return (status.innerHTML = '<p class="panel error">Please enter a valid email address.</p>');

    state.userName = name;
    state.userEmail = email;
    status.innerHTML =
      '<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> Drafting formal complaint...</div>';

    const clause = activeClause();
    try {
      const complaintData = await Api.createComplaint({
        user_name: name,
        district: state.district,
        clause_text: activeClauseText(),
        clause_type: clause.clause_type || "unknown",
        doc_type: state.docType,
        plain_explanation: clause.plain_explanation || "",
        legal_citation: clause.legal_citation || "",
      });
      state.complaintData = complaintData;
      state.screen = "emailPreview";
      render();
    } catch (err) {
      status.innerHTML = `<p class="panel error">${esc(err.message)}</p>`;
    }
  };
}

// ---- Screen 5: Email preview ---------------------------------------------

function renderEmailPreview() {
  const c = state.complaintData;
  root.innerHTML = `
    <h2>Review your complaint email</h2>
    <p class="muted">This will be sent to the DLSA office. You'll receive a copy.
    Please read it carefully first.</p>

    <p><strong>To:</strong> ${esc(c.dlsa_email)}<br>
    <strong>Cc:</strong> ${esc(state.userEmail)}<br>
    <strong>Subject:</strong> Legal Complaint - Illegal Clause in Agreement - ${esc(state.district)}</p>

    <div class="email-preview">${esc(c.complaint_text)}</div>

    <button class="btn-primary" id="sendBtn">Send this email</button>
    <button class="btn-outline" id="downloadBtn">Download and send yourself</button>
    <button class="btn-text" id="back">Go back</button>
    <div id="sendStatus"></div>

    <div class="disclaimer">
      Verify DLSA email addresses at tnsla.tn.gov.in if you don't hear back
      within 7 working days. Free helpline: 15100.
    </div>
  `;

  document.getElementById("downloadBtn").onclick = () =>
    downloadText(c.complaint_text, "dlsa_complaint.txt");

  document.getElementById("back").onclick = () => {
    state.screen = "dlsaForm";
    render();
  };

  document.getElementById("sendBtn").onclick = async () => {
    const status = document.getElementById("sendStatus");
    status.innerHTML =
      '<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> Sending complaint to DLSA...</div>';
    try {
      const sendResult = await Api.sendComplaint({
        to_address: c.dlsa_email,
        user_email: state.userEmail,
        subject: `Legal Complaint - Illegal Clause in Agreement - ${state.district}`,
        complaint_text: c.complaint_text,
        dlsa_office: c.dlsa_office,
      });
      state.sendResult = sendResult;
      state.screen = "confirmation";
      render();
    } catch (err) {
      status.innerHTML = `<p class="panel error">${esc(err.message)}</p>`;
    }
  };
}

// ---- Screen 6: Confirmation ----------------------------------------------

function renderConfirmation() {
  const c = state.complaintData;
  const s = state.sendResult || {};

  root.innerHTML = `
    <h2>${s.success ? "Complaint sent" : "Could not send automatically"}</h2>
    ${
      s.success
        ? `<div class="panel confirm">
             Sent to: ${esc(s.sent_to)}<br>
             A copy was sent to: ${esc(s.cc)}
           </div>
           <p class="muted">Expected response time is 3 to 7 working days.</p>`
        : `<div class="panel error">${esc(s.error || "Unknown error.")}</div>
           <p>Please download the complaint and send it manually.</p>
           <button class="btn-outline" id="downloadBtn">Download complaint letter</button>`
    }

    <h2 style="margin-top:1.4rem">DLSA office details</h2>
    <div class="panel dlsa">
      <strong>${esc(c.dlsa_office)}</strong><br>
      Address: ${esc(c.dlsa_address)}<br>
      Phone: ${esc(c.dlsa_phone)}<br>
      Email: ${esc(c.dlsa_email)}
    </div>

    <div class="helpline">Free Legal Aid Helpline: 15100 (available across Tamil Nadu)</div>
    <p class="muted">Website: tnsla.tn.gov.in</p>

    <button class="btn-primary" id="another">Check another clause</button>

    <div class="disclaimer">
      This tool is not a substitute for legal counsel. For urgent situations,
      call 15100 immediately.
    </div>
  `;

  const dl = document.getElementById("downloadBtn");
  if (dl) dl.onclick = () => downloadText(c.complaint_text, "dlsa_complaint.txt");

  document.getElementById("another").onclick = reset;
}

// ---- Utilities -------------------------------------------------------

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

render();