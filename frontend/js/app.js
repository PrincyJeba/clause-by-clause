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
  history: [], // stack of previous screen names, for the back arrow
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
  bulkMode: false, // true when acting on ALL risky clauses from an image result at once
  counterLang: null, // "en" | "ta" | null — null means "match the site-wide language"
  complaintData: {},
  userName: "",
  userEmail: "",
  sendResult: null,
};

const root = document.getElementById("app-main");

function reset() {
  Object.assign(state, {
    screen: "input",
    history: [],
    clauseText: "",
    result: {},
    imageBase64: null,
    imageMimeType: null,
    imagePreviewUrl: null,
    imageClauses: [],
    imageSummary: null,
    selectedClauseIndex: null,
    bulkMode: false,
    counterLang: null,
    complaintData: {},
    userName: "",
    userEmail: "",
    sendResult: null,
  });
  render();
}

// Navigate forward to a new screen, remembering where we came from so the
// back arrow can return to it.
function goTo(screen) {
  state.history.push(state.screen);
  state.screen = screen;
  render();
}

// Navigate to whatever screen we were on before. Does nothing if there's
// nowhere to go back to (e.g. already on the first screen).
function goBack() {
  const prev = state.history.pop();
  if (prev) {
    state.screen = prev;
    render();
  }
}

// All clauses from an image result that came back HIGH risk.
function highRiskClauses() {
  return state.imageClauses.filter((c) => c.risk_level === "HIGH");
}

// A synthetic "clause" that stitches together every risky clause from an
// image result, so the counter-message / DLSA-complaint screens can treat
// "all of them at once" the same way they treat a single clause.
function combinedClause() {
  const risky = highRiskClauses();
  const numbered = (fn) =>
    risky.map((c, i) => `${i + 1}. ${prettyClauseType(c.clause_type)}: ${fn(c)}`).join("\n\n");

  return {
    clause_type: "multiple_clauses",
    clause_text: numbered((c) => c.clause_text || "(text not captured)"),
    plain_explanation: numbered((c) => c.plain_explanation || ""),
    legal_citation: risky.map((c) => c.legal_citation).filter(Boolean).join("; "),
    counter_message: risky
      .map((c, i) => `${i + 1}. Regarding the ${prettyClauseType(c.clause_type).toLowerCase()}:\n${c.counter_message || ""}`)
      .join("\n\n"),
  };
}

// Returns the clause data currently in play: every risky clause combined
// (bulk mode), one clause picked from an image result, or the single
// pasted-text result.
function activeClause() {
  if (state.bulkMode) return combinedClause();
  return state.selectedClauseIndex !== null
    ? state.imageClauses[state.selectedClauseIndex]
    : state.result;
}

function activeClauseText() {
  if (state.bulkMode) return combinedClause().clause_text;
  return state.selectedClauseIndex !== null
    ? state.imageClauses[state.selectedClauseIndex].clause_text || ""
    : state.clauseText;
}

// The counter-message box has its own language toggle, independent of the
// site-wide one — so this reads counter_message_en / counter_message_ta
// directly off the source clause(s) rather than going through
// activeClause().counter_message (which is frozen at whatever language the
// site was in when the analyze call was made).
function activeCounterMessage(lang) {
  const field = lang === "ta" ? "counter_message_ta" : "counter_message_en";

  if (state.bulkMode) {
    const risky = highRiskClauses();
    return risky
      .map((c, i) => {
        const text = c[field] || c.counter_message || "";
        return `${i + 1}. Regarding the ${prettyClauseType(c.clause_type).toLowerCase()}:\n${text}`;
      })
      .join("\n\n");
  }

  const clause =
    state.selectedClauseIndex !== null
      ? state.imageClauses[state.selectedClauseIndex]
      : state.result;
  return (clause && (clause[field] || clause.counter_message)) || "";
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
  renderBackArrow();
}

// A back arrow shown above every screen except the very first one, wired
// to the history stack built up by goTo().
function renderBackArrow() {
  if (state.history.length === 0) return;
  const bar = document.createElement("div");
  bar.className = "back-nav";
  bar.innerHTML = `<button type="button" id="backArrowBtn" class="btn-back" aria-label="Go back">&#8592; ${t("nav.back")}</button>`;
  root.insertBefore(bar, root.firstChild);
  document.getElementById("backArrowBtn").onclick = goBack;
}

// ---- Screen 1: Input --------------------------------------------------

function renderInput() {
  const districtOptions = DISTRICTS.map(
    (d) => `<option value="${d}" ${d === state.district ? "selected" : ""}>${d}</option>`
  ).join("");

  const isImage = state.inputMode === "image";

  root.innerHTML = `
    <h2>${t("input.title")}</h2>
    <p class="muted">${t("input.subtitle")}</p>

    <div class="btn-row" role="tablist">
      <button class="${isImage ? "btn-outline" : "btn-primary"}" id="modeText" type="button">${t("input.modeText")}</button>
      <button class="${isImage ? "btn-primary" : "btn-outline"}" id="modeImage" type="button">${t("input.modeImage")}</button>
    </div>

    <div class="row" style="margin-top:1rem">
      <div>
        <label for="docType">${t("input.docType")}</label>
        <select id="docType">
          <option value="rental" ${state.docType === "rental" ? "selected" : ""}>${t("input.docType.rental")}</option>
          <option value="loan" ${state.docType === "loan" ? "selected" : ""}>${t("input.docType.loan")}</option>
        </select>
      </div>
      <div>
        <label for="district">${t("input.district")}</label>
        <select id="district">${districtOptions}</select>
      </div>
    </div>

    <div id="modeBody"></div>

    <button class="btn-primary" id="analyzeBtn">${isImage ? t("input.analyzeImage") : t("input.analyzeText")}</button>
    <div id="analyzeStatus"></div>

    <div class="disclaimer">${t("input.disclaimer")}</div>
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
    <label for="clauseText">${t("input.clauseLabel")}</label>
    <textarea id="clauseText" placeholder="${esc(t("input.clausePlaceholder"))}">${esc(state.clauseText)}</textarea>

    <details class="samples">
      <summary>${t("input.tryASample")}</summary>
      <div class="btn-row">
        <button class="btn-outline" id="sampleRental">${t("input.sampleRental")}</button>
        <button class="btn-outline" id="sampleLoan">${t("input.sampleLoan")}</button>
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
    <label for="imageInput">${t("input.imageLabel")}</label>
    <input type="file" id="imageInput" accept="image/*" capture="environment" />
    <p class="muted" style="font-size:0.85rem">${t("input.imageHint")}</p>
    <div id="imagePreviewWrap"></div>
  `;

  if (state.imagePreviewUrl) {
    document.getElementById("imagePreviewWrap").innerHTML = `
      <img src="${state.imagePreviewUrl}" alt="${esc(t("input.imageAlt"))}"
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
      `<p class="panel error">${t("input.errNoText")}</p>`;
    return;
  }
  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  document.getElementById("analyzeStatus").innerHTML =
    `<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> ${t("input.checkingText")}</div>`;

  try {
    const result = await Api.analyzeClause(text, state.docType, state.district);
    state.result = result;
    state.selectedClauseIndex = null;
    state.bulkMode = false;
    state.counterLang = null;
    goTo("result");
  } catch (err) {
    document.getElementById("analyzeStatus").innerHTML =
      `<p class="panel error">${esc(t("err.generic", { msg: err.message }))}</p>`;
    btn.disabled = false;
  }
}

async function runImageAnalysis() {
  if (!state.imageBase64) {
    document.getElementById("analyzeStatus").innerHTML =
      `<p class="panel error">${t("input.errNoImage")}</p>`;
    return;
  }
  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  document.getElementById("analyzeStatus").innerHTML =
    `<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> ${t("input.checkingImage")}</div>`;

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
    state.bulkMode = false;
    state.counterLang = null;
    goTo("imageResult");
  } catch (err) {
    document.getElementById("analyzeStatus").innerHTML =
      `<p class="panel error">${esc(t("err.generic", { msg: err.message }))}</p>`;
    btn.disabled = false;
  }
}

// ---- Screen 2: Result ---------------------------------------------------

function renderResult() {
  const r = state.result;

  if (r.error) {
    root.innerHTML = `
      <h2>${t("result.errTitle")}</h2>
      <p class="panel error">${esc(r.error)}</p>
      <button class="btn-primary" id="retry">${t("result.retry")}</button>
    `;
    document.getElementById("retry").onclick = reset;
    return;
  }

  if (r.risk_level === "HIGH") {
    root.innerHTML = `
      <span class="stamp high">${t("result.highStamp")}</span>
      <p>${t("result.highIntro")}</p>

      ${r.plain_explanation ? `
        <h2>${t("result.whatItMeansFor")}</h2>
        <div class="panel explain">${esc(r.plain_explanation)}</div>
      ` : ""}

      ${r.legal_citation ? `<div class="panel citation">${esc(t("result.legalBasis", { v: r.legal_citation }))}</div>` : ""}
      ${r.legal_limit ? `<div class="panel citation">${esc(t("result.legalLimit", { v: r.legal_limit }))}</div>` : ""}

      <h2>${t("result.whatNext")}</h2>
      <p class="muted">${t("result.optionA")}</p>
      <button class="btn-primary" id="toCounter">${t("result.sendCounter")}</button>

      <p class="muted" style="margin-top:1rem">${t("result.optionB")}</p>
      <button class="btn-gold" id="toDlsa">${t("result.reportDlsa")}</button>

      <div class="disclaimer">${t("result.disclaimer")}</div>
    `;
    document.getElementById("toCounter").onclick = () => goTo("counter");
    document.getElementById("toDlsa").onclick = () => goTo("dlsaForm");
  } else {
    root.innerHTML = `
      <span class="stamp low">${t("result.lowStamp")}</span>
      <p>${t("result.lowIntro")}</p>

      ${r.plain_explanation ? `
        <h2>${t("result.whatItMeans")}</h2>
        <div class="panel explain">${esc(r.plain_explanation)}</div>
      ` : ""}
      ${r.legal_citation ? `<div class="panel citation">${esc(t("result.reference", { v: r.legal_citation }))}</div>` : ""}
      ${r.summary ? `<p>${esc(r.summary)}</p>` : ""}

      <p class="muted">${t("result.stillWrong", { num: "<strong>15100</strong>" })}</p>

      <button class="btn-primary" id="another">${t("result.checkAnother")}</button>
    `;
    document.getElementById("another").onclick = reset;
  }
}

function overallVerdict(highCount, total) {
  if (highCount === 0) return t("verdict.allClear");
  if (highCount === total) {
    if (currentLang() === "en" && total === 1) {
      return "The 1 clause checked appears to violate Tamil Nadu law. We would not recommend signing this as-is — push back or escalate using the options below first.";
    }
    return t("verdict.allBad", { total });
  }
  return t("verdict.someBad", { high: highCount, total });
}

// ---- Screen 2b: Image result — a list of every clause found -------------

function renderImageResult() {
  const clauses = state.imageClauses;

  if (!clauses.length) {
    root.innerHTML = `
      <h2>${t("err.noClausesTitle")}</h2>
      <p class="panel error">${t("err.noClausesBody")}</p>
      <button class="btn-primary" id="another">${t("result.retry")}</button>
    `;
    document.getElementById("another").onclick = reset;
    return;
  }

  const highCount = clauses.filter((c) => c.risk_level === "HIGH").length;
  const verdict = (state.imageSummary && state.imageSummary.trim()) || overallVerdict(highCount, clauses.length);

  const cards = clauses
    .map((c, i) => {
      const isHigh = c.risk_level === "HIGH";
      return `
        <div class="panel ${isHigh ? "explain" : "confirm"}" style="border-left-color: ${isHigh ? "var(--red)" : "var(--green)"}">
          <span class="stamp ${isHigh ? "high" : "low"}" style="font-size:0.8rem; padding:0.35rem 0.7rem; margin-bottom:0.5rem;">
            ${isHigh ? t("result.highStamp") : t("imgResult.standard")}
          </span>
          <p style="font-weight:600; margin-top:0.3rem;">${esc(prettyClauseType(c.clause_type))}</p>
          ${c.clause_text ? `<p class="muted" style="font-size:0.85rem; font-style:italic;">"${esc(truncate(c.clause_text, 140))}"</p>` : ""}
          ${c.plain_explanation ? `<p style="font-size:0.92rem;">${esc(c.plain_explanation)}</p>` : ""}
          ${c.legal_citation ? `<p class="muted" style="font-size:0.82rem;">${esc(t("imgResult.legalBasis", { v: c.legal_citation }))}</p>` : ""}
          ${isHigh ? `
            <div class="btn-row">
              <button class="btn-primary" data-action="counter" data-index="${i}">${t("imgResult.counter")}</button>
              <button class="btn-gold" data-action="dlsa" data-index="${i}">${t("imgResult.dlsa")}</button>
            </div>
          ` : ""}
        </div>
      `;
    })
    .join("");

  const bulkSection = highCount > 1 ? `
    <div class="panel dlsa">
      <p style="font-weight:600; margin-top:0">${t("imgResult.bulkTitle", { n: highCount })}</p>
      <p class="muted" style="font-size:0.9rem">${t("imgResult.bulkBody")}</p>
      <div class="btn-row">
        <button class="btn-primary" id="bulkCounter">${t("imgResult.bulkCounter")}</button>
        <button class="btn-gold" id="bulkDlsa">${t("imgResult.bulkDlsa")}</button>
      </div>
    </div>
  ` : "";

  root.innerHTML = `
    <h2>${currentLang() === "en" && clauses.length === 1
      ? "1 clause found"
      : t("imgResult.title", { n: clauses.length })}</h2>
    <div class="panel ${highCount > 0 ? "explain" : "confirm"}">${esc(verdict)}</div>

    ${cards}

    ${bulkSection}

    <button class="btn-primary" id="another" style="margin-top:1rem">${t("imgResult.checkAnother")}</button>

    <div class="disclaimer">${t("result.disclaimer")}</div>
  `;

  root.querySelectorAll('[data-action="counter"]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedClauseIndex = parseInt(btn.dataset.index, 10);
      state.bulkMode = false;
      goTo("counter");
    };
  });
  root.querySelectorAll('[data-action="dlsa"]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedClauseIndex = parseInt(btn.dataset.index, 10);
      state.bulkMode = false;
      goTo("dlsaForm");
    };
  });

  const bulkCounterBtn = document.getElementById("bulkCounter");
  if (bulkCounterBtn) {
    bulkCounterBtn.onclick = () => {
      state.selectedClauseIndex = null;
      state.bulkMode = true;
      goTo("counter");
    };
  }
  const bulkDlsaBtn = document.getElementById("bulkDlsa");
  if (bulkDlsaBtn) {
    bulkDlsaBtn.onclick = () => {
      state.selectedClauseIndex = null;
      state.bulkMode = true;
      goTo("dlsaForm");
    };
  }

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
  const effectiveLang = state.counterLang || currentLang();
  const msg = activeCounterMessage(effectiveLang);
  const bulk = state.bulkMode;
  root.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.6rem;">
      <h2 style="margin:0;">${bulk ? t("counter.titleBulk") : t("counter.title")}</h2>
      <div class="mini-lang-toggle">
        <button type="button" class="mini-lang-btn${effectiveLang === "en" ? " active" : ""}" id="counterLangEn">English</button>
        <button type="button" class="mini-lang-btn${effectiveLang === "ta" ? " active" : ""}" id="counterLangTa">தமிழ்</button>
      </div>
    </div>
    <p class="muted">${bulk ? t("counter.subtitleBulk") : t("counter.subtitle")}</p>

    <textarea id="counterText" style="min-height:200px">${esc(msg)}</textarea>

    <div class="btn-row">
      <button class="btn-outline" id="copyBtn">${t("counter.copy")}</button>
      <button class="btn-outline" id="downloadBtn">${t("counter.download")}</button>
    </div>

    <p class="muted" style="margin-top:1rem">${bulk ? t("counter.escalateHintBulk") : t("counter.escalateHint")}</p>

    <div class="btn-row">
      <button class="btn-gold" id="toDlsa">${bulk ? t("counter.escalateBulk") : t("counter.escalate")}</button>
      <button class="btn-text" id="another">${t("counter.another")}</button>
    </div>

    <div class="helpline">${t("counter.helpline")}</div>
  `;

  document.getElementById("counterLangEn").onclick = () => {
    state.counterLang = "en";
    renderCounter();
  };
  document.getElementById("counterLangTa").onclick = () => {
    state.counterLang = "ta";
    renderCounter();
  };

  document.getElementById("copyBtn").onclick = async () => {
    await navigator.clipboard.writeText(document.getElementById("counterText").value);
    document.getElementById("copyBtn").textContent = t("counter.copied");
    setTimeout(() => (document.getElementById("copyBtn").textContent = t("counter.copy")), 1200);
  };
  document.getElementById("downloadBtn").onclick = () => {
    downloadText(document.getElementById("counterText").value, "counter_message.txt");
  };
  document.getElementById("toDlsa").onclick = () => goTo("dlsaForm");
  document.getElementById("another").onclick = reset;
}

// ---- Screen 4: DLSA form -------------------------------------------------

// The DLSA complaint is a formal letter to a government office and always
// stays in English (see email.note), regardless of what language the site
// or the counter-message box are currently showing. This pulls the
// unlocalized _en fields rather than whatever activeClause() has, which may
// be frozen in Tamil if the analysis itself was run with the site in Tamil.
function activeComplaintFields() {
  if (state.bulkMode) {
    const risky = highRiskClauses();
    const numbered = (fn) =>
      risky.map((c, i) => `${i + 1}. ${prettyClauseType(c.clause_type)}: ${fn(c)}`).join("\n\n");
    return {
      clause_type: "multiple_clauses",
      clause_text: numbered((c) => c.clause_text || "(text not captured)"),
      plain_explanation_en: numbered((c) => c.plain_explanation_en || c.plain_explanation || ""),
      legal_citation_en: risky.map((c) => c.legal_citation_en || c.legal_citation).filter(Boolean).join("; "),
    };
  }

  const clause =
    state.selectedClauseIndex !== null ? state.imageClauses[state.selectedClauseIndex] : state.result;
  return {
    clause_type: (clause && clause.clause_type) || "unknown",
    clause_text: activeClauseText(),
    plain_explanation_en: (clause && (clause.plain_explanation_en || clause.plain_explanation)) || "",
    legal_citation_en: (clause && (clause.legal_citation_en || clause.legal_citation)) || "",
  };
}

function renderDlsaForm() {
  const bulk = state.bulkMode;
  root.innerHTML = `
    <h2>${t("dlsa.title")}</h2>
    <p class="muted">${bulk ? t("dlsa.subtitleBulk") : t("dlsa.subtitle")}</p>
    <div id="dlsaInfo" class="panel dlsa">${t("dlsa.loading")}</div>

    <label for="userName">${t("dlsa.nameLabel")}</label>
    <input type="text" id="userName" value="${esc(state.userName)}" placeholder="${esc(t("dlsa.namePlaceholder"))}" />

    <label for="userEmail">${t("dlsa.emailLabel")}</label>
    <input type="email" id="userEmail" value="${esc(state.userEmail)}" placeholder="${esc(t("dlsa.emailPlaceholder"))}" />
    <p class="muted" style="font-size:0.85rem">${t("dlsa.emailNote")}</p>

    <button class="btn-primary" id="draftBtn">${t("dlsa.draftBtn")}</button>
    <div id="dlsaStatus"></div>
  `;

  Api.getDlsaOffice(state.district)
    .then((office) => {
      document.getElementById("dlsaInfo").innerHTML = `
        <strong>${esc(office.office)}</strong><br>
        ${esc(t("dlsa.address", { v: office.address }))}<br>
        ${esc(t("dlsa.phone", { v: office.phone }))}
      `;
    })
    .catch(() => {
      document.getElementById("dlsaInfo").textContent = t("dlsa.loadFailed");
    });

  document.getElementById("draftBtn").onclick = async () => {
    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const status = document.getElementById("dlsaStatus");

    if (!name) return (status.innerHTML = `<p class="panel error">${t("dlsa.errNoName")}</p>`);
    if (!email || !email.includes("@"))
      return (status.innerHTML = `<p class="panel error">${t("dlsa.errBadEmail")}</p>`);

    state.userName = name;
    state.userEmail = email;
    status.innerHTML =
      `<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> ${t("dlsa.drafting")}</div>`;

    const fields = activeComplaintFields();
    try {
      const complaintData = await Api.createComplaint({
        user_name: name,
        district: state.district,
        clause_text: fields.clause_text,
        clause_type: fields.clause_type,
        doc_type: state.docType,
        plain_explanation: fields.plain_explanation_en,
        legal_citation: fields.legal_citation_en,
      });
      state.complaintData = complaintData;
      goTo("emailPreview");
    } catch (err) {
      status.innerHTML = `<p class="panel error">${esc(t("err.generic", { msg: err.message }))}</p>`;
    }
  };
}

// ---- Screen 5: Email preview ---------------------------------------------

function renderEmailPreview() {
  const c = state.complaintData;
  const bulk = state.bulkMode;
  // The complaint itself is always drafted/sent in English (a formal letter
  // to a government office) regardless of the app's language setting — see
  // the note below the preview.
  const subject = t(bulk ? "email.subjectLineBulk" : "email.subjectLineSingle", { district: state.district });
  root.innerHTML = `
    <h2>${t("email.title")}</h2>
    <p class="muted">${t("email.subtitle")}</p>

    <p><strong>${t("email.toLabel")}:</strong> ${esc(c.dlsa_email)}<br>
    <strong>${t("email.ccLabel")}:</strong> ${esc(state.userEmail)}<br>
    <strong>${t("email.subjectLabel")}:</strong> ${esc(subject)}</p>

    <div class="email-preview">${esc(c.complaint_text)}</div>

    <button class="btn-primary" id="sendBtn">${t("email.send")}</button>
    <button class="btn-outline" id="downloadBtn">${t("email.downloadSelf")}</button>
    <div id="sendStatus"></div>

    <p class="muted" style="font-size:0.82rem; margin-top:1rem">${t("email.note")}</p>

    <div class="disclaimer">${t("email.disclaimer")}</div>
  `;

  document.getElementById("downloadBtn").onclick = () =>
    downloadText(c.complaint_text, "dlsa_complaint.txt");

  document.getElementById("sendBtn").onclick = async () => {
    const status = document.getElementById("sendStatus");
    status.innerHTML =
      `<div class="spinner"><span class="dot"></span><span class="dot"></span><span class="dot"></span> ${t("email.sending")}</div>`;
    try {
      const sendResult = await Api.sendComplaint({
        to_address: c.dlsa_email,
        user_email: state.userEmail,
        subject,
        complaint_text: c.complaint_text,
        dlsa_office: c.dlsa_office,
      });
      state.sendResult = sendResult;
      goTo("confirmation");
    } catch (err) {
      status.innerHTML = `<p class="panel error">${esc(t("err.generic", { msg: err.message }))}</p>`;
    }
  };
}

// ---- Screen 6: Confirmation ----------------------------------------------

function renderConfirmation() {
  const c = state.complaintData;
  const s = state.sendResult || {};

  root.innerHTML = `
    <h2>${s.success ? t("confirm.sentTitle") : t("confirm.failedTitle")}</h2>
    ${
      s.success
        ? `<div class="panel confirm">
             ${esc(t("confirm.sentTo", { v: s.sent_to }))}<br>
             ${esc(t("confirm.ccTo", { v: s.cc }))}
           </div>
           <p class="muted">${t("confirm.eta")}</p>`
        : `<div class="panel error">${esc(s.error || t("confirm.unknownError"))}</div>
           <p>${t("confirm.sendManually")}</p>
           <button class="btn-outline" id="downloadBtn">${t("confirm.downloadLetter")}</button>`
    }

    <h2 style="margin-top:1.4rem">${t("confirm.officeDetails")}</h2>
    <div class="panel dlsa">
      <strong>${esc(c.dlsa_office)}</strong><br>
      ${esc(t("confirm.address", { v: c.dlsa_address }))}<br>
      ${esc(t("confirm.phone", { v: c.dlsa_phone }))}<br>
      ${esc(t("confirm.email", { v: c.dlsa_email }))}
    </div>

    <div class="helpline">${t("confirm.helpline")}</div>
    <p class="muted">${t("confirm.website")}</p>

    <button class="btn-primary" id="another">${t("confirm.another")}</button>

    <div class="disclaimer">${t("confirm.disclaimer")}</div>
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




