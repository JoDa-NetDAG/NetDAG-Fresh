(function () {
  const modal = document.getElementById("contactModal");
  const openBtns = document.querySelectorAll("[data-contact-open]");
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("contactStatus");

  if (!modal || !form) return;

  const closeEls = modal.querySelectorAll("[data-contact-close]");

  function setStatus(msg, color) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = color || "#ffcc80";
  }

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setStatus("", "");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openBtns.forEach((btn) => {
    if (btn.tagName === "BUTTON") btn.setAttribute("type", "button");
    btn.addEventListener("click", openModal);
  });

  closeEls.forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Read your existing stake modal fields
    const name = (document.getElementById("cName")?.value || "").trim();
    const email = (document.getElementById("cEmail")?.value || "").trim();
    const topic = (document.getElementById("cTopic")?.value || "").trim();
    const message = (document.getElementById("cMessage")?.value || "").trim();

    if (!name || !email || !topic || !message) {
      setStatus("Please fill in all fields.", "#ff6b6b");
      return;
    }

    setStatus("Sending…", "#ffcc80");

    try {
      // Map to the API fields you created in /api/contact.js
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name,
          lastName: "(Website)",
          email: email,
          message: `Topic: ${topic}\n\n${message}`,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setStatus("Message sent ✅", "#53ff73");
      form.reset();
      setTimeout(closeModal, 900);
    } catch (err) {
      console.error(err);
      setStatus("Failed to send. Please try again later.", "#ff6b6b");
    }
  });
})();