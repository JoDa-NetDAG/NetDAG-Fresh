// provenance.js
// Currently no dynamic scripts needed.
//
// Example: Pause animated belt on hover:
/* document.addEventListener('DOMContentLoaded', function(){
  var belt = document.querySelector('.provenance-belt');
  if(!belt) return;

  belt.addEventListener('mouseenter', function(){
    belt.style.animationPlayState = 'paused';
  });

  belt.addEventListener('mouseleave', function(){
    belt.style.animationPlayState = 'running';
  });
});
*/


/* =========================================================
   provenance.js — NetDAG Provenance
   - Optional: pause belt animation on hover (safe)
   - Phone animation: bend -> sweep -> center -> vibrate -> wait 10s -> loop
   - Targets: #provPhone (preferred) OR .prov-hero-img fallback
   ========================================================= */
(function () {
  "use strict";

  console.log("✅ provenance.js loaded");

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function initPhoneAnimation() {
    const phone =
      document.getElementById("provPhone") ||
      document.querySelector(".prov-hero-img");

    console.log("[prov] phone element:", phone);

    if (!phone) return;

    // CONFIG
    const SCALE = 1.3;
    const SHIFT = 80;
    const ROT = 5.0;

    // TIMING
    const T_BEND1 = 1200;
    const T_SWEEP = 4000;
    const T_RETURN = 1400;
    const T_SHAKE_STEP = 60;
    const WAIT_10S = 3000;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // JS owns transform
    phone.style.animation = "none";
    phone.style.willChange = "transform";
    phone.style.transformOrigin = "center center";

    function setT(x, r, dur, easing = "ease-in-out") {
      phone.style.transition = `transform ${dur}ms ${easing}`;
      phone.style.transform = `translateX(${x}px) rotate(${r}deg) scale(${SCALE})`;
    }

    async function shake() {
      phone.style.transition = `transform ${T_SHAKE_STEP}ms linear`;
      for (const v of [-4, 4, -3, 3, -2, 2, -1, 1, 0]) {
        phone.style.transform = `translateX(${v}px) rotate(${v * 0.22}deg) scale(${SCALE})`;
        await sleep(T_SHAKE_STEP);
      }
    }

    async function loop() {
      // center start
      phone.style.transition = "none";
      phone.style.transform = `translateX(0px) rotate(0deg) scale(${SCALE})`;
      await sleep(120);

      while (true) {
        // bend left
        setT(-SHIFT, -ROT, T_BEND1);
        await sleep(T_BEND1);

        // sweep right (all the way)
        setT(SHIFT, ROT, T_SWEEP);
        await sleep(T_SWEEP);

        // back to center
        setT(0, 0, T_RETURN);
        await sleep(T_RETURN);

        // vibrate
        await shake();

        // wait 10s
        setT(0, 0, 200, "linear");
        await sleep(WAIT_10S);
      }
    }

    if (phone.complete) loop();
    else phone.addEventListener("load", loop, { once: true });
  }

  onReady(initPhoneAnimation);
})();


(function () {
  "use strict";

  console.log("✅ provenance.js loaded");

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* -----------------------------------------
     A) OPTIONAL: Pause animated belt on hover
     (ONLY if .provenance-belt exists)
     ----------------------------------------- */
  function initBeltHoverPause() {
    const belt = document.querySelector(".provenance-belt");
    if (!belt) return;

    belt.addEventListener("mouseenter", function () {
      belt.style.animationPlayState = "paused";
    });

    belt.addEventListener("mouseleave", function () {
      belt.style.animationPlayState = "running";
    });
  }

  /* -----------------------------------------
     B) PHONE ANIMATION
     ----------------------------------------- */
  function initPhoneAnimation() {
    const phone =
      document.getElementById("provPhone") ||
      document.querySelector(".prov-hero-img");

    console.log("[prov] phone element:", phone);

    if (!phone) {
      console.warn(
        '[prov] ❌ No phone found. Add id="provPhone" to the <img> OR keep class="prov-hero-img".'
      );
      return;
    }

    // CONFIG
    const SCALE = 1.3;          // +30%
    const SHIFT_PX = 22;        // move distance
    const ROT_DEG = 2.4;        // bend angle
    const DIRECTION = "ltr";    // "ltr" or "rtl"

    // TIMING (ms)
    const T_START = 120;
    const T_BEND1 = 1200;
    const T_SWEEP = 2800;
    const T_RETURN = 1400;
    const T_SHAKE_STEP = 60;
    const WAIT_10S = 10000;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // IMPORTANT: JS owns transform (avoid CSS transform/animation on the same element)
    phone.style.animation = "none";
    phone.style.willChange = "transform";
    phone.style.transformOrigin = "center center";

    function setT(x, r, dur, easing = "ease-in-out") {
      phone.style.transition = `transform ${dur}ms ${easing}`;
      phone.style.transform = `translateX(${x}px) rotate(${r}deg) scale(${SCALE})`;
    }

    async function shake() {
      phone.style.transition = `transform ${T_SHAKE_STEP}ms linear`;
      const seq = [-4, 4, -3, 3, -2, 2, -1, 1, 0];
      for (const v of seq) {
        phone.style.transform = `translateX(${v}px) rotate(${v * 0.22}deg) scale(${SCALE})`;
        await sleep(T_SHAKE_STEP);
      }
    }

    async function loop() {
      // start centered
      phone.style.transition = "none";
      phone.style.transform = `translateX(0px) rotate(0deg) scale(${SCALE})`;
      await sleep(T_START);

      const dir = DIRECTION === "rtl" ? -1 : 1;

      while (true) {
        // Bend to one side
        setT(-dir * SHIFT_PX, -dir * ROT_DEG, T_BEND1);
        await sleep(T_BEND1);

        // Sweep all the way to the other side
        setT(dir * SHIFT_PX, dir * ROT_DEG, T_SWEEP);
        await sleep(T_SWEEP);

        // Back to center
        setT(0, 0, T_RETURN);
        await sleep(T_RETURN);

        // Shake-off
        await shake();

        // Wait 10 seconds
        setT(0, 0, 200, "linear");
        await sleep(WAIT_10S);
      }
    }

    // Start after image load to avoid jump
    if (phone.complete) loop();
    else phone.addEventListener("load", loop, { once: true });
  }

  onReady(function () {
    initBeltHoverPause();
    initPhoneAnimation();
  });
})();
