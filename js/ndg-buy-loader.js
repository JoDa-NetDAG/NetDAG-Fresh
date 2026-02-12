// js/ndg-buy-loader.js
(() => {
  async function injectBuyModal() {
    if (document.getElementById("ndgBuyModal")) return;

    const res = await fetch("/partials/ndg-buy-modal.html", { cache: "no-store" });
    if (!res.ok) return console.warn("❌ Buy modal fetch failed:", res.status);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const modal = doc.querySelector("#ndgBuyModal");
    if (modal) document.body.appendChild(modal);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await injectBuyModal();
  });
})();