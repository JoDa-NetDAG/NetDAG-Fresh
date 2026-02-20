console.log("✅ Contact Modal loaded");

/* ============================================
   CONTACT MODAL CONTROLLER
   Handles modal open/close & form submission
   ============================================ */

(function () {
  'use strict';

  let modal = null;

  // Get modal element (lazy load)
  function getModal() {
    if (!modal) modal = document.getElementById("contactModal");
    return modal;
  }

  // Close modal
  function closeModal() {
    const m = getModal();
    if (!m) return;
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Bind event listeners once
  function bindModalOnce() {
    const m = getModal();
    if (!m || m.__contactBound) return;
    m.__contactBound = true;

    // Close buttons & backdrop
    m.querySelectorAll("[data-contact-close]").forEach((el) =>
      el.addEventListener("click", closeModal)
    );

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && m.getAttribute("aria-hidden") === "false") {
        closeModal();
      }
    });
  }

  // Open modal
  function openModal() {
    const m = getModal();
    if (!m) {
      console.warn("Contact modal not found yet (not injected?)");
      return;
    }
    bindModalOnce();
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    
    // Reset form if it exists
    const form = document.getElementById("contactForm");
    if (form) {
      form.reset();
      clearErrors();
      hideStatus();
    }
  }

  // Clear all error messages
  function clearErrors() {
    document.querySelectorAll(".form-error").forEach(el => el.textContent = "");
  }

  // Show error message
  function showError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + "Error");
    if (errorEl) errorEl.textContent = message;
  }

  // Show status message
  function showStatus(type, message) {
    const statusEl = document.getElementById("formStatus");
    if (!statusEl) return;
    
    statusEl.className = `form-status ${type}`;
    statusEl.querySelector(".status-message").textContent = message;
    statusEl.style.display = "block";
  }

  // Hide status message
  function hideStatus() {
    const statusEl = document.getElementById("formStatus");
    if (statusEl) statusEl.style.display = "none";
  }

  // Validate email
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate form
  function validateForm(formData) {
    clearErrors();
    let isValid = true;

    // Validate name
    const name = formData.get("name").trim();
    if (name.length < 2) {
      showError("name", "Name must be at least 2 characters");
      isValid = false;
    }

    // Validate email
    const email = formData.get("email").trim();
    if (!isValidEmail(email)) {
      showError("email", "Please enter a valid email address");
      isValid = false;
    }

    // Validate subject
    const subject = formData.get("subject").trim();
    if (subject.length < 3) {
      showError("subject", "Subject must be at least 3 characters");
      isValid = false;
    }

    // Validate message
    const message = formData.get("message").trim();
    if (message.length < 10) {
      showError("message", "Message must be at least 10 characters");
      isValid = false;
    }

    return isValid;
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById("contactSubmit");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");
    
    // Get form data
    const formData = new FormData(form);
    
    // Validate
    if (!validateForm(formData)) {
      return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "block";
    hideStatus();
    
    try {
      // Send to contact handler
      const response = await fetch("/contact-handler.php", {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus("success", "✓ Message sent successfully! We'll get back to you soon.");
        form.reset();
        
        // Close modal after 3 seconds
        setTimeout(() => {
          closeModal();
        }, 3000);
      } else {
        showStatus("error", result.message || "Failed to send message. Please try again.");
      }
      
    } catch (error) {
      console.error("Contact form error:", error);
      showStatus("error", "Network error. Please check your connection and try again.");
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      btnText.style.display = "block";
      btnLoader.style.display = "none";
    }
  }

  // Bind form submission when modal is injected
  function bindFormSubmission() {
    const form = document.getElementById("contactForm");
    if (form && !form.__submitBound) {
      form.__submitBound = true;
      form.addEventListener("submit", handleSubmit);
    }
  }

  // Auto-bind when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    bindModalOnce();
    bindFormSubmission();
  });

  // Also try to bind after a short delay (in case modal is injected late)
  setTimeout(() => {
    bindModalOnce();
    bindFormSubmission();
  }, 500);

  // ✅ Expose global functions
  window.OPEN_CONTACT_MODAL = openModal;
  window.CLOSE_CONTACT_MODAL = closeModal;
  window.BIND_CONTACT_MODAL = bindModalOnce;

})();