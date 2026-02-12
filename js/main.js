/* js/main.js
   Presale helpers + small UI utilities
   - animateNumber(node, start, end, duration)
   - setPresaleProgress(percent, totalRaised)
   - simulateProgressDemo() (optional demo)
   - Live Countdown Timer
*/

(() => {
  'use strict';

  /* -------------------------
     Helper:  Animate a numeric value
  ------------------------- */
  function animateNumber(node, start, end, duration = 900) {
    start = Number(start) || 0;
    end = Number(end) || 0;
    const isFloat = String(end).includes('.') || String(start).includes('.');
    const startTime = performance.now();

    return new Promise((resolve) => {
      function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - (1 - t) * (1 - t);
        const value = start + (end - start) * eased;
        if (isFloat) {
          node.textContent = value.toFixed(2);
        } else {
          node.textContent = Math.round(value).toLocaleString();
        }
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  /* -------------------------
     Update the progress bar width and the percent badge
  ------------------------- */
  function setPresaleProgress(targetPercent = 0, totalRaised = 0) {
    const fillEl = document.getElementById('presaleFill');
    const percentEl = document.getElementById('presalePercent');
    const raisedEl = document.getElementById('presaleRaised');
    const dotEl = document.getElementById('presaleDot');

    if (!fillEl || !percentEl || !raisedEl) return;

    const pct = Math.max(0, Math.min(100, Number(targetPercent)));

    fillEl.style.width = pct + '%';

    if (dotEl) {
      const safePct = Math.min(99.6, Math.max(0.4, pct));
      dotEl.style.left = safePct + '%';
    }

    const currentText = (percentEl.textContent || '').replace('%', '').trim();
    const current = Number(currentText) || 0;
    const startTime = performance.now();
    const duration = 900;
    
    function animatePercent(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const val = Math.round(current + (pct - current) * eased);
      percentEl.textContent = val + '%';
      if (t < 1) requestAnimationFrame(animatePercent);
    }
    requestAnimationFrame(animatePercent);

    const numericTarget = (typeof totalRaised === 'number')
      ? totalRaised
      : Number(String(totalRaised).replace(/[^0-9.\-]/g, '')) || 0;

    const currentRaisedText = raisedEl.getAttribute('data-numeric') || raisedEl.textContent;
    const currentRaisedNum = Number(String(currentRaisedText).replace(/[^0-9.\-]/g, '')) || 0;

    animateNumber(raisedEl, currentRaisedNum, numericTarget, duration).then(() => {
      if (typeof totalRaised === 'string' && /[^0-9.,$]/.test(totalRaised)) {
        raisedEl.textContent = totalRaised;
      } else {
        raisedEl.textContent = `$${numericTarget.toLocaleString()}`;
      }
      raisedEl.setAttribute('data-numeric', numericTarget);
    });
  }

  window.setPresaleProgress = setPresaleProgress;

  /* -------------------------
     🔥 LIVE COUNTDOWN TIMER (MOVED OUTSIDE simulateProgressDemo)
  ------------------------- */
  function updateCountdown() {
    const targetDate = new Date('2026-02-14T00:00:00Z').getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    // If countdown finished
    if (distance < 0) {
      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minsEl = document.getElementById('mins');
      const secsEl = document.getElementById('secs');
      
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update DOM using IDs
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('mins');
    const secsEl = document.getElementById('secs');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  // 🚀 START COUNTDOWN ON PAGE LOAD
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* -------------------------
     Demo: automatic growth (optional)
  ------------------------- */
  function simulateProgressDemo() {
    let currentPct = 6;
    let currentRaised = 420000;
    setPresaleProgress(currentPct, currentRaised);

    const step = () => {
      if (currentPct >= 75) return;
      currentPct += Math.round(Math.random() * 6) + 1;
      currentPct = Math.min(75, currentPct);
      currentRaised += Math.round(Math.random() * 2000) + 500;
      setPresaleProgress(currentPct, `$${currentRaised.toLocaleString()}`);
      setTimeout(step, 3000 + Math.random() * 3000);
    };
    setTimeout(step, 1400);
  }

  // Uncomment to run demo: 
  // simulateProgressDemo();
  /* -------------------------
     Integration
  ------------------------- */
  if (typeof updateTopOffsets === 'function') {
    try { updateTopOffsets(); } catch (e) { /* ignore */ }
  }

    window._animateNumber = animateNumber;
  
  })(); // Close the IIFE that started at line 8
  
     /* -------------------------
       Update presale progress bar from CSS variable
    --------------------------- */
    function updatePresaleBar() {
    const root = document.documentElement;
    const progress = parseFloat(getComputedStyle(root).getPropertyValue('--presale-progress').trim()) || 3.6;
    
    const barFill = document.getElementById('presaleBarFill');
    const progressText = document.getElementById('progressPercent');
    
    if (barFill) {
      barFill.style.width = progress + '%';
    }
    
    if (progressText) {
      progressText.textContent = progress;
    }
  }

  // Run on page load
  updatePresaleBar();

  /* -------------------------
   Smooth scroll to top
--------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  const backToTopLinks = document.querySelectorAll('a[href="#top"]');
  
  backToTopLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  });
});

/* ====================================
   NETDAG MAIN JAVASCRIPT
   ==================================== */

// ===== BONDING CURVE ANIMATIONS =====

const BONDING_CURVE_SETTINGS = {
  // Net swing settings
  netSwingDuration: 8,        // 8 seconds per full swing (higher = slower)
  netSwingAmount: 40,         // 15px movement (higher = wider swing)
  netSwingUp: 8,
  
  // Rocket settings
  rocketCount: 4,            // Number of light balls
  rocketSpeed: 18,             // ✅ CHANGED:  8 seconds per journey (was 3 - now slower!)
  rocketSize: 12,             // ✅ CHANGED: 12px diameter (was 4 - now bigger!)
  rocketGlowSize: 40,         // ✅ CHANGED: 40px glow (was 20 - now more visible!)
  rocketColors: [
    'rgba(0, 217, 255, 0.9)',   // Bright blue
    'rgba(255, 153, 0, 0.9)',   // Orange
    'rgba(197, 105, 6, 0.9)', // Purple
    'rgba(0, 200, 255, 0.8)'    // Cyan
  ]
};

// Net swing animation
function initNetSwing() {
  const netImage = document.querySelector('.bonding-curve-fullscreen-bg');
  if (!netImage) return;
  
  netImage.style.setProperty('--swing-duration', `${BONDING_CURVE_SETTINGS.netSwingDuration}s`);
  netImage.style.setProperty('--swing-amount', `${BONDING_CURVE_SETTINGS.netSwingAmount}px`);
  netImage.classList.add('net-swing-active');
}

// Flying rockets
function initFlyingRockets() {
  const section = document.querySelector('.section-bonding-curve');
  if (!section) return;
  
  const rocketContainer = document.createElement('div');
  rocketContainer.className = 'rocket-container';
  section.appendChild(rocketContainer);
  
  for (let i = 0; i < BONDING_CURVE_SETTINGS.rocketCount; i++) {
    createRocket(rocketContainer, i);
  }
}

function createRocket(container, index) {
  const rocket = document.createElement('div');
  rocket.className = 'light-rocket';
  
  const color = BONDING_CURVE_SETTINGS.rocketColors[Math.floor(Math.random() * BONDING_CURVE_SETTINGS.rocketColors.length)];
  
  const startSide = Math.floor(Math.random() * 4);
  let startX, startY, endX, endY;
  
  switch(startSide) {
    case 0: // From top
      startX = Math.random() * 100;
      startY = -5;
      endX = Math.random() * 100;
      endY = 105;
      break;
    case 1: // From right
      startX = 105;
      startY = Math.random() * 100;
      endX = -5;
      endY = Math.random() * 100;
      break;
    case 2: // From bottom
      startX = Math.random() * 100;
      startY = 105;
      endX = Math.random() * 100;
      endY = -5;
      break;
    case 3: // From left
      startX = -5;
      startY = Math.random() * 100;
      endX = 105;
      endY = Math.random() * 100;
      break;
  }
  
  const delay = (index / BONDING_CURVE_SETTINGS.rocketCount) * BONDING_CURVE_SETTINGS.rocketSpeed;
  
  rocket.style.setProperty('--start-x', `${startX}%`);
  rocket.style.setProperty('--start-y', `${startY}%`);
  rocket.style.setProperty('--end-x', `${endX}%`);
  rocket.style.setProperty('--end-y', `${endY}%`);
  rocket.style.setProperty('--rocket-duration', `${BONDING_CURVE_SETTINGS.rocketSpeed}s`);
  rocket.style.setProperty('--rocket-delay', `${delay}s`);
  rocket.style.setProperty('--rocket-color', color);
  rocket.style.setProperty('--rocket-size', `${BONDING_CURVE_SETTINGS.rocketSize}px`);
  rocket.style.setProperty('--glow-size', `${BONDING_CURVE_SETTINGS.rocketGlowSize}px`);
  
  container.appendChild(rocket);
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  // Bonding Curve animations
  initNetSwing();
  initFlyingRockets();
  
  // Future:  Add other animations here
});

// ===== PAUSE ANIMATIONS ON REDUCED MOTION =====
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const style = document.createElement('style');
  style.textContent = `
    .net-swing-active,
    .light-rocket {
      animation: none !important;
    }
  `;
  document.head.appendChild(style);
}

// Hamburger menu open/close logic for all pages
document.addEventListener('DOMContentLoaded', function () {
  const menuToggle = document.getElementById('menu-toggle');
  const siteMenu = document.getElementById('site-menu');
  const siteMenuClose = document.getElementById('site-menu-close');
  if (!menuToggle || !siteMenu) return;
  menuToggle.addEventListener('click', function () {
    siteMenu.hidden = false;
    siteMenu.setAttribute('aria-hidden', 'false');
    siteMenu.focus && siteMenu.focus();
  });
  siteMenuClose && siteMenuClose.addEventListener('click', function () {
    siteMenu.hidden = true;
    siteMenu.setAttribute('aria-hidden', 'true');
  });
  // Optional: Close menu when clicking outside panel
  siteMenu.addEventListener('click', function (e) {
    if (e.target === siteMenu) {
      siteMenu.hidden = true;
      siteMenu.setAttribute('aria-hidden', 'true');
    }
  });
});

// =========================
// Provenance preview phone: tiny -> push out (LEFT) -> idle float
// =========================
(() => {
  const phone = document.querySelector(".prov-phone-zoom");
  if (!phone) return;

  const section =
    phone.closest(".provenance-preview") ||
    phone.closest("#provenance-preview");

  function startAnim() {
    phone.classList.add("is-in");
    phone.addEventListener(
      "animationend",
      () => {
        // After push-out ends, add idle float
        phone.classList.remove("is-in");
        phone.classList.add("is-idle");
      },
      { once: true }
    );
  }

  // If we cannot find the section wrapper, animate immediately (safe fallback)
  if (!section) {
    startAnim();
    return;
  }

  // Animate when section becomes visible
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e.isIntersecting) return;
      startAnim();
      io.disconnect();
    },
    { threshold: 0.35 }
  );

  io.observe(section);
})();

/* ============================================
   ROTATING HEADLINES - Auto Carousel
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  
  // Get all headlines and dots
  const headlines = document.querySelectorAll('.rotating-headlines .headline');
  const dots = document.querySelectorAll('.headline-dots .dot');
  
  // Check if elements exist
  if (headlines.length === 0 || dots.length === 0) {
    console.log('Rotating headlines not found on this page');
    return;
  }
  
  let currentIndex = 0;
  let rotationInterval;
  let isPaused = false;
  
  // Function to show specific headline
  function showHeadline(index) {
    // Remove active class from all
    headlines.forEach(h => h.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    
    // Add active class to current
    headlines[index].classList.add('active');
    dots[index].classList.add('active');
    
    currentIndex = index;
  }
  
  // Function to show next headline
  function nextHeadline() {
    if (isPaused) return;
    
    let nextIndex = (currentIndex + 1) % headlines.length;
    showHeadline(nextIndex);
  }
  
  // Start auto-rotation (5 seconds)
  function startRotation() {
    rotationInterval = setInterval(nextHeadline, 6000); // 5000ms = 5 seconds
  }
  
  // Stop rotation
  function stopRotation() {
    clearInterval(rotationInterval);
  }
  
  // Click on dots to navigate
  dots.forEach((dot, index) => {
    dot.addEventListener('click', function() {
      showHeadline(index);
      stopRotation();
      startRotation(); // Restart timer after manual click
    });
  });
  
  // Pause on hover over headlines
  const rotatingContainer = document.querySelector('.rotating-headlines');
  
  rotatingContainer.addEventListener('mouseenter', function() {
    isPaused = true;
  });
  
  rotatingContainer.addEventListener('mouseleave', function() {
    isPaused = false;
  });
  
  // Start the rotation
  startRotation();
  
  console.log('✅ Rotating headlines initialized - 5 second intervals');
});