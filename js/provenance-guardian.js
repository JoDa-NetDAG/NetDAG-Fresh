/* ============================================================
   NetDAG Provenance Guardian
   Guardian Confidence Layer for Provenance Verification

   Purpose:
   - Adds a light Guardian confidence signal to Provenance results.
   - Does NOT replace blockchain verification.
   - Does NOT accuse products based on weak scan assumptions.
   - Does NOT use location/device tracking.
   - Only checks record quality, visible metadata and verification context.

   Safe principle:
   Blockchain = proof layer
   Guardian = confidence/context layer
============================================================ */

(() => {
  "use strict";

  const GUARDIAN_VERSION = "1.0.0";

  const GUARDIAN_LEVELS = {
    STRONG: {
      label: "Strong",
      className: "guardian-confidence-strong",
      summary: "Record confidence is strong."
    },
    STANDARD: {
      label: "Standard",
      className: "guardian-confidence-standard",
      summary: "Record confidence is standard."
    },
    LIMITED: {
      label: "Limited",
      className: "guardian-confidence-limited",
      summary: "Record confidence is limited."
    },
    NOT_CONFIRMED: {
      label: "Not Confirmed",
      className: "guardian-confidence-not-confirmed",
      summary: "Record confidence is not confirmed."
    }
  };

  const STORAGE_KEY = "netdag_provenance_guardian_history_v1";

  function safeText(value) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function getTextById(id) {
    const el = document.getElementById(id);
    return safeText(el ? el.textContent : "");
  }

  function getInputValueById(id) {
    const el = document.getElementById(id);
    return safeText(el ? el.value : "");
  }

  function looksLikeRecordId(recordId) {
    const value = safeText(recordId).toUpperCase();

    if (!value) return false;

    return (
      value.startsWith("NDG-PROV-") ||
      value.startsWith("NDG-") ||
      value.includes("PROV")
    );
  }

  function isWeakValue(value) {
    const v = safeText(value).toLowerCase();

    if (!v) return true;

    return (
      v === "-" ||
      v === "n/a" ||
      v === "na" ||
      v === "unknown" ||
      v === "unknown product" ||
      v === "not available" ||
      v === "undefined" ||
      v === "null"
    );
  }

  function getCurrentRecordContext() {
    const recordId =
      getInputValueById("provVerifyId") ||
      getTextById("provOutRecordId") ||
      getTextById("provRecordId") ||
      getTextById("recordId") ||
      "";

    const company =
      getTextById("provOutCompany") ||
      getTextById("provCompany") ||
      "";

    const product =
      getTextById("provOutProduct") ||
      getTextById("provProduct") ||
      getTextById("provOutProductName") ||
      "";

    const batch =
      getTextById("provOutBatch") ||
      getTextById("provBatch") ||
      "";

    const created =
      getTextById("provOutCreated") ||
      getTextById("provCreated") ||
      getTextById("provOutTimestamp") ||
      getTextById("provTimestamp") ||
      "";

    const anchored =
      getTextById("provOutAnchor") ||
      getTextById("provAnchor") ||
      getTextById("provOutHash") ||
      getTextById("provHash") ||
      "";

    const badgeText =
      getTextById("provBadge") ||
      getTextById("provStatus") ||
      getTextById("provVerifyStatus") ||
      "";

    return {
      recordId,
      company,
      product,
      batch,
      created,
      anchored,
      badgeText
    };
  }

  function inferVerificationState(context) {
    const badge = safeText(context.badgeText).toLowerCase();

    if (
      badge.includes("confirmed") ||
      badge.includes("verified") ||
      badge.includes("authentic")
    ) {
      return "confirmed";
    }

    if (
      badge.includes("not") ||
      badge.includes("failed") ||
      badge.includes("missing") ||
      badge.includes("invalid")
    ) {
      return "not_confirmed";
    }

    if (
      context.recordId &&
      (context.anchored || context.company || context.product || context.created)
    ) {
      return "partial";
    }

    return "unknown";
  }

  function analyzeRecord(context) {
    const reasons = [];
    const cautions = [];

    const verificationState = inferVerificationState(context);

    if (verificationState === "not_confirmed") {
      return {
        level: GUARDIAN_LEVELS.NOT_CONFIRMED,
        score: 0,
        reasons: [
          "No confirmed Provenance record was detected for this verification."
        ],
        cautions: [
          "Guardian does not replace on-chain proof. Please confirm the record through the official NetDAG verification flow."
        ],
        context
      };
    }

    let score = 0;

    if (looksLikeRecordId(context.recordId)) {
      score += 20;
      reasons.push("Record ID format is recognizable.");
    } else {
      cautions.push("Record ID format is limited or not clearly recognizable.");
    }

    if (verificationState === "confirmed") {
      score += 35;
      reasons.push("Verification status indicates an authentic or confirmed record.");
    } else if (verificationState === "partial") {
      score += 15;
      cautions.push("Some verification context is visible, but confirmation is limited.");
    } else {
      cautions.push("Guardian could not clearly read a confirmed verification status.");
    }

    if (!isWeakValue(context.company)) {
      score += 10;
      reasons.push("Issuer or company information is visible.");
    } else {
      cautions.push("Issuer or company information is missing or limited.");
    }

    if (!isWeakValue(context.product)) {
      score += 10;
      reasons.push("Product information is visible.");
    } else {
      cautions.push("Product information is missing or limited.");
    }

    if (!isWeakValue(context.batch)) {
      score += 8;
      reasons.push("Batch or product reference information is visible.");
    } else {
      cautions.push("Batch or product reference information is limited.");
    }

    if (!isWeakValue(context.created)) {
      score += 7;
      reasons.push("Timestamp or creation information is visible.");
    } else {
      cautions.push("Timestamp or creation information is limited.");
    }

    if (!isWeakValue(context.anchored)) {
      score += 10;
      reasons.push("Anchor/hash information is visible.");
    } else {
      cautions.push("Anchor or hash information is not clearly visible.");
    }

    let level = GUARDIAN_LEVELS.LIMITED;

    if (score >= 75) {
      level = GUARDIAN_LEVELS.STRONG;
    } else if (score >= 50) {
      level = GUARDIAN_LEVELS.STANDARD;
    } else if (score >= 20) {
      level = GUARDIAN_LEVELS.LIMITED;
    } else {
      level = GUARDIAN_LEVELS.NOT_CONFIRMED;
    }

    return {
      level,
      score,
      reasons,
      cautions,
      context
    };
  }

  function ensureGuardianStyles() {
    if (document.getElementById("ndg-provenance-guardian-style")) return;

    const style = document.createElement("style");
    style.id = "ndg-provenance-guardian-style";
    style.textContent = `
      .prov-guardian-panel {
        margin-top: 18px;
        padding: 18px;
        border-radius: 16px;
        border: 1px solid rgba(255, 153, 0, 0.28);
        background:
          radial-gradient(circle at top left, rgba(255, 153, 0, 0.12), transparent 34%),
          rgba(10, 12, 22, 0.88);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
        color: #eef2ff;
      }

      .prov-guardian-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }

      .prov-guardian-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #ffbf49;
        letter-spacing: 0.02em;
      }

      .prov-guardian-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid rgba(255, 255, 255, 0.16);
      }

      .guardian-confidence-strong {
        color: #bbf7d0;
        background: rgba(34, 197, 94, 0.16);
        border-color: rgba(34, 197, 94, 0.34);
      }

      .guardian-confidence-standard {
        color: #bfdbfe;
        background: rgba(59, 130, 246, 0.16);
        border-color: rgba(59, 130, 246, 0.34);
      }

      .guardian-confidence-limited {
        color: #fde68a;
        background: rgba(245, 158, 11, 0.16);
        border-color: rgba(245, 158, 11, 0.36);
      }

      .guardian-confidence-not-confirmed {
        color: #fecaca;
        background: rgba(239, 68, 68, 0.16);
        border-color: rgba(239, 68, 68, 0.36);
      }

      .prov-guardian-summary {
        margin: 0 0 12px;
        color: rgba(255,255,255,0.86);
        line-height: 1.6;
      }

      .prov-guardian-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 12px;
      }

      .prov-guardian-box {
        padding: 12px;
        border-radius: 12px;
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.08);
      }

      .prov-guardian-box strong {
        display: block;
        margin-bottom: 8px;
        color: #ffbf49;
        font-size: 0.9rem;
      }

      .prov-guardian-box ul {
        margin: 0;
        padding-left: 18px;
      }

      .prov-guardian-box li {
        margin-bottom: 6px;
        line-height: 1.45;
        color: rgba(255,255,255,0.78);
        font-size: 0.9rem;
      }

      .prov-guardian-note {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.68);
        font-size: 0.86rem;
        line-height: 1.55;
      }

      @media (max-width: 760px) {
        .prov-guardian-grid {
          grid-template-columns: 1fr;
        }

        .prov-guardian-panel {
          padding: 15px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getPreferredMount() {
    const candidates = [
      document.getElementById("provCertificate"),
      document.querySelector(".prov-cert"),
      document.querySelector(".prov-certificate"),
      document.querySelector(".prov-result"),
      document.querySelector(".prov-mvp-card"),
      document.querySelector("#provVerifyResult"),
      document.querySelector("#provResult"),
      document.querySelector("main")
    ];

    return candidates.find(Boolean);
  }

  function ensurePanel() {
    ensureGuardianStyles();

    let panel = document.getElementById("provGuardianPanel");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "provGuardianPanel";
    panel.className = "prov-guardian-panel";
    panel.hidden = true;

    const mount = getPreferredMount();

    if (mount && mount !== document.querySelector("main")) {
      mount.appendChild(panel);
    } else if (mount) {
      mount.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }

    return panel;
  }

  function listItems(items, fallback) {
    const list = Array.isArray(items) && items.length ? items : [fallback];

    return list
      .slice(0, 4)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
  }

  function escapeHtml(value) {
    return safeText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderGuardianResult(analysis) {
    const panel = ensurePanel();
    const level = analysis.level;

    panel.hidden = false;
    panel.innerHTML = `
      <div class="prov-guardian-head">
        <h3 class="prov-guardian-title">🛡️ Guardian Confidence</h3>
        <span class="prov-guardian-pill ${escapeHtml(level.className)}">
          ${escapeHtml(level.label)}
        </span>
      </div>

      <p class="prov-guardian-summary">
        ${escapeHtml(level.summary)} Guardian adds verification context without replacing the on-chain Provenance record.
      </p>

      <div class="prov-guardian-grid">
        <div class="prov-guardian-box">
          <strong>Confidence Signals</strong>
          <ul>
            ${listItems(analysis.reasons, "Available verification context was reviewed.")}
          </ul>
        </div>

        <div class="prov-guardian-box">
          <strong>Context Notes</strong>
          <ul>
            ${listItems(analysis.cautions, "No additional caution was detected from visible record fields.")}
          </ul>
        </div>
      </div>

      <div class="prov-guardian-note">
        Guardian is a confidence layer. It does not accuse products based on scan count, location, travel patterns or weak assumptions.
        Blockchain anchoring remains the proof layer.
      </div>
    `;

    saveGuardianHistory(analysis);
  }

  function saveGuardianHistory(analysis) {
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      history.unshift({
        time: new Date().toISOString(),
        version: GUARDIAN_VERSION,
        recordId: analysis.context.recordId || "",
        confidence: analysis.level.label,
        score: analysis.score
      });

      const trimmed = history.slice(0, 30);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.warn("NetDAG Guardian history could not be saved:", error);
    }
  }

  function runGuardianAnalysis() {
    const context = getCurrentRecordContext();

    if (!context.recordId && !context.badgeText && !context.product && !context.company) {
      return null;
    }

    const analysis = analyzeRecord(context);
    renderGuardianResult(analysis);
    return analysis;
  }

  function attachToFormsAndButtons() {
    const possibleButtons = [
      document.getElementById("provVerifyBtn"),
      document.getElementById("provVerifyButton"),
      document.querySelector("[data-provenance-verify]"),
      document.querySelector("#provVerifyForm button"),
      document.querySelector(".prov-verify-form button")
    ].filter(Boolean);

    possibleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setTimeout(runGuardianAnalysis, 700);
        setTimeout(runGuardianAnalysis, 1800);
      });
    });

    const possibleForms = [
      document.getElementById("provVerifyForm"),
      document.querySelector(".prov-verify-form")
    ].filter(Boolean);

    possibleForms.forEach((form) => {
      form.addEventListener("submit", () => {
        setTimeout(runGuardianAnalysis, 700);
        setTimeout(runGuardianAnalysis, 1800);
      });
    });
  }

  function watchForResultChanges() {
    const target =
      document.getElementById("provCertificate") ||
      document.querySelector(".prov-cert") ||
      document.querySelector(".prov-certificate") ||
      document.querySelector("#provVerifyResult") ||
      document.querySelector("#provResult");

    if (!target || !window.MutationObserver) return;

    const observer = new MutationObserver(() => {
      clearTimeout(window.__ndgGuardianTimer);
      window.__ndgGuardianTimer = setTimeout(runGuardianAnalysis, 300);
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  }

  function exposeApi() {
    window.NDGProvenanceGuardian = {
      version: GUARDIAN_VERSION,
      analyze: runGuardianAnalysis,
      getContext: getCurrentRecordContext,
      getHistory() {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
          return [];
        }
      },
      clearHistory() {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
  }

  function init() {
    ensureGuardianStyles();
    ensurePanel();
    attachToFormsAndButtons();
    watchForResultChanges();
    exposeApi();

    setTimeout(runGuardianAnalysis, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();