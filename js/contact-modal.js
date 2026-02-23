/* NetDAG Contact Modal Handler */

(function() {
  'use strict';

  const modal = document.getElementById('contactModal');
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');

  if (!modal || !form || !status) return;

  // Open modal
  document.querySelectorAll('[data-contact-open]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close modal
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    form.reset();
    status.textContent = '';
    status.className = 'contact-status';
  }

  document.querySelectorAll('[data-contact-close]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  modal.querySelector('.ndg-modal-backdrop').addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.contact-submit-btn');
    const formData = new FormData(form);

    // Validate
    const firstName = formData.get('firstName').trim();
    const lastName = formData.get('lastName').trim();
    const email = formData.get('email').trim();
    const message = formData.get('message').trim();

    if (!firstName || !lastName || !email || !message) {
      status.textContent = 'Please fill in all fields.';
      status.className = 'contact-status error';
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    status.textContent = 'Sending your message...';
    status.className = 'contact-status';
    status.style.display = 'block';

    try {
      const response = await fetch('send-contact.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        status.textContent = '✓ Message sent! We\'ll respond within 24 hours.';
        status.className = 'contact-status success';
        form.reset();
        setTimeout(() => closeModal(), 3000);
      } else {
        status.textContent = '✗ ' + result.message;
        status.className = 'contact-status error';
      }

    } catch (error) {
      console.error('Form error:', error);
      status.textContent = '✗ Something went wrong. Please email us at info@netdag.com';
      status.className = 'contact-status error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });

})();