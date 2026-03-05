/* js/community-modal-inject.js
   NetDAG Community Modal (Injected)
   - Injects CSS + HTML once
   - Opens from: data-ndg-community-open OR data-community-open OR data-contact-open OR data-ndg-contact-open
   - Closes from: data-ndg-community-close
*/

(function () {
  // Prevent double-injection
  if (window.__NDG_COMMUNITY_INJECTED__) return;
  window.__NDG_COMMUNITY_INJECTED__ = true;

  function injectCSS() {
    if (document.getElementById("ndg-community-inject-css")) return;

    var style = document.createElement("style");
    style.id = "ndg-community-inject-css";
    style.textContent = `
/* =========================
   NETDAG COMMUNITY MODAL (Injected)
   ========================= */

/* Safety: hide any old email/contact modal if it still exists anywhere */
#ndgContactModal,
.ndg-contact-modal{
  display:none !important;
  visibility:hidden !important;
  pointer-events:none !important;
}

.ndg-community-modal{
  position: fixed;
  inset: 0;
  display: none;
  z-index: 999999; /* above everything */
}

.ndg-community-modal.is-open{
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.ndg-community-backdrop{
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.65);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.ndg-community-card{
  position: relative;
  width: min(520px, 92vw);
  max-height: calc(100vh - 36px);
  overflow: auto;
  margin: 0;
  padding: 18px 18px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.10);
  background: #0f0f14;
  color: #fff;
  box-shadow: 0 24px 70px rgba(0,0,0,.55);
  z-index: 1;
}

.ndg-community-x{
  position:absolute;
  right:10px;
  top:10px;
  width:36px;
  height:36px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.25);
  color:#fff;
  font-size:22px;
  cursor:pointer;
}

.ndg-community-title{
  margin: 4px 0 6px;
  font-size: 22px;
  font-weight: 900;
}

.ndg-community-sub{
  margin: 0 0 14px;
  font-size: 13px;
  color: rgba(255,255,255,.78);
  line-height: 1.45;
}

.ndg-community-actions{
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.ndg-community-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: #fff;
  text-decoration:none;
  font-weight: 800;
}

.ndg-community-btn:hover{
  border-color: rgba(255,153,0,.40);
  background: rgba(255,153,0,.10);
}

.ndg-community-divider{
  height:1px;
  background: rgba(255,255,255,.10);
  margin: 14px 0 12px;
}

.ndg-community-foot{
  margin: 0 0 12px;
  font-size: 12px;
  color: rgba(255,255,255,.75);
  text-align: center;
}

.ndg-community-email{
  color:#ff9900;
  text-decoration:none;
}

.ndg-community-email:hover{ text-decoration: underline; }

.ndg-community-ok{
  width:100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: none;
  font-weight: 900;
  cursor: pointer;
  background: #ff9900;
  color: #111;
}

/* =========================
   END NETDAG COMMUNITY MODAL
   ========================= */
`;
    document.head.appendChild(style);
  }

  function injectHTML() {
    if (document.getElementById("ndgCommunityModal")) return;

    var wrap = document.createElement("div");
    wrap.innerHTML = `
<div id="ndgCommunityModal" class="ndg-community-modal" aria-hidden="true">
  <div class="ndg-community-backdrop" data-ndg-community-close></div>

  <div class="ndg-community-card" role="dialog" aria-modal="true" aria-labelledby="ndgCommunityTitle">
    <button type="button" class="ndg-community-x" aria-label="Close" data-ndg-community-close>×</button>

    <h3 id="ndgCommunityTitle" class="ndg-community-title">Contact NetDAG</h3>
    <p class="ndg-community-sub">
      The NetDAG presale is launching soon.<br>
      Join the community for updates, announcements and early access.
    </p>

    <div class="ndg-community-actions">
      <a class="ndg-community-btn" href="https://discord.com/invite/netdag" target="_blank" rel="noopener">
        <i class="fab fa-discord"></i>
        Join our Discord Community
      </a>

      <a class="ndg-community-btn" href="https://t.me/netdag" target="_blank" rel="noopener">
        <i class="fab fa-telegram"></i>
        Join our Telegram Channel
      </a>

      <a class="ndg-community-btn" href="https://twitter.com/netdag" target="_blank" rel="noopener">
        <i class="fab fa-x-twitter"></i>
        Follow NetDAG on X
      </a>
    </div>

    <div class="ndg-community-divider"></div>

    <p class="ndg-community-foot">
      Partnerships &amp; media:
      <a class="ndg-community-email" href="mailto:info@netdag.com">info@netdag.com</a>
    </p>

    <button type="button" class="ndg-community-ok" data-ndg-community-close>OK</button>
  </div>
</div>
`;
    document.body.appendChild(wrap.firstElementChild);
  }

  function getModal() {
    return document.getElementById("ndgCommunityModal");
  }

  function openModal() {
    var modal = getModal();
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    // lock scroll
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var modal = getModal();
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    // unlock scroll
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  function bindEvents() {
    // Click open/close (supports old + new triggers)
    document.addEventListener(
      "click",
      function (e) {
        // OPEN: support old + new triggers
        if (
          e.target.closest("[data-ndg-community-open]") ||
          e.target.closest("[data-community-open]") ||
          e.target.closest("[data-contact-open]") ||
          e.target.closest("[data-ndg-contact-open]")
        ) {
          e.preventDefault();
          openModal();
          return;
        }

        // CLOSE
        if (e.target.closest("[data-ndg-community-close]")) {
          e.preventDefault();
          closeModal();
          return;
        }
      },
      true
    );

    // ESC to close
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function init() {
    injectCSS();
    injectHTML();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();