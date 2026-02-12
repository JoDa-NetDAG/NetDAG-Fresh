console.log("✅ NDG Buy Modal loaded");

/* =========================
   NDG BUY MODAL (works with injected partial)
   - Safe even if #ndgBuyModal is added later by loader
========================= */
(function () {
  let modal = null;

  function getModal() {
    if (!modal) modal = document.getElementById("ndgBuyModal");
    return modal;
  }

  function closeModal() {
    const m = getModal();
    if (!m) return;
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function bindModalOnce() {
    const m = getModal();
    if (!m || m.__ndgBound) return;
    m.__ndgBound = true;

    // Close buttons/backdrop
    m.querySelectorAll("[data-ndg-close]").forEach((el) =>
      el.addEventListener("click", closeModal)
    );

    // ESC to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  function openModal() {
    const m = getModal();
    if (!m) {
      console.warn("ndgBuyModal not found yet (not injected?)");
      return;
    }
    bindModalOnce();
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  // ✅ Always define globals, even before modal exists
  window.NDG_OPEN_BUY_MODAL = openModal;
  window.NDG_CLOSE_BUY_MODAL = closeModal;
  window.NDG_BIND_BUY_MODAL = bindModalOnce;

  // Optional legacy button support (if some pages still use #navBuyNdg)
  document.addEventListener("DOMContentLoaded", () => {
    bindModalOnce();
    const legacyBtn = document.getElementById("navBuyNdg");
    if (legacyBtn) {
      legacyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });
})();

/* =========================
   NDG estimate engine (USD <-> NDG + Earlybird)
   - Binds whenever modal exists (injected or static)
========================= */
(function () {
  // ✅ Set your live/preview price here
  const PRICE_USD_PER_NDG = 0.025;

  // Earlybird bonus: +8% per 30 days (airdropped separately)
  const BONUS_30 = 0.08;
  const BONUS_60 = 0.16;
  const BONUS_90 = 0.24;

  function bindNdgCalc() {
    const usdInput = document.getElementById("ndgUsdInput");
    const ndgInput = document.getElementById("ndgNdgInput");

    const outTokens = document.getElementById("ndgTokensOut");
    const outCost = document.getElementById("ndgCostOut");

    const b30 = document.getElementById("ndgBonus30");
    const b60 = document.getElementById("ndgBonus60");
    const b90 = document.getElementById("ndgBonus90");

    // If modal not injected yet, nothing to bind
    if (!usdInput || !ndgInput || !outTokens || !outCost) return false;

    let lock = false;

    const fmt = (n) =>
      Number.isFinite(n)
        ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : "—";

    function render(ndg, usd) {
      outTokens.textContent = fmt(ndg);
      outCost.textContent = fmt(usd);

      // Earlybird preview
      if (b30) b30.textContent = fmt(ndg * BONUS_30);
      if (b60) b60.textContent = fmt(ndg * BONUS_60);
      if (b90) b90.textContent = fmt(ndg * BONUS_90);
    }

    function readNum(el) {
      const v = String(el.value || "").replace(/,/g, "").trim();
      if (v === "") return NaN;
      return Number(v);
    }

    function onUsd() {
      if (lock) return;
      const usd = readNum(usdInput);
      if (!Number.isFinite(usd) || usd <= 0) return render(NaN, NaN);

      const ndg = usd / PRICE_USD_PER_NDG;

      lock = true;
      ndgInput.value = (Math.floor(ndg * 100) / 100).toString();
      lock = false;

      render(ndg, usd);
    }

    function onNdg() {
      if (lock) return;
      const ndg = readNum(ndgInput);
      if (!Number.isFinite(ndg) || ndg <= 0) return render(NaN, NaN);

      const usd = ndg * PRICE_USD_PER_NDG;

      lock = true;
      usdInput.value = (Math.floor(usd * 100) / 100).toString();
      lock = false;

      render(ndg, usd);
    }

    // Prevent double-binding
    if (usdInput.__ndgBoundCalc) return true;
    usdInput.__ndgBoundCalc = true;

    usdInput.addEventListener("input", onUsd);
    ndgInput.addEventListener("input", onNdg);

    // Initial render
    onUsd();
    return true;
  }

  // Bind on DOM ready (works if modal is already in page)
  document.addEventListener("DOMContentLoaded", () => {
    bindNdgCalc();
  });

  // Also bind when modal opens (works if modal is injected later)
  const oldOpen = window.NDG_OPEN_BUY_MODAL;
  window.NDG_OPEN_BUY_MODAL = function () {
    if (typeof oldOpen === "function") oldOpen();
    bindNdgCalc();
  };

  // Also allow loader to call this immediately after injecting modal
  const oldBind = window.NDG_BIND_BUY_MODAL;
  window.NDG_BIND_BUY_MODAL = function () {
    if (typeof oldBind === "function") oldBind();
    bindNdgCalc();
  };
})();
