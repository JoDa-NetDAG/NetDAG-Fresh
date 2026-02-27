// Guardian shield "pump" animation (subtle scale in/out)
// Uses requestAnimationFrame for smoothness, and respects prefers-reduced-motion.

(function () {
  const shield = document.getElementById("guardianShield");
  if (!shield) return;

  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  shield.classList.add("is-pumping");

  // Tunables
  const baseScale = 1;
  const amplitude = 0.6; // how much it grows/shrinks
  const speed = 0.05;    // pump speed

  let start = null;

  function frame(t) {
    if (start === null) start = t;
    const elapsed = t - start;

    // Smooth sine wave
    const s = baseScale + Math.sin(elapsed * speed * Math.PI * 2) * amplitude;

    shield.style.transform = `scale(${s.toFixed(4)})`;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();