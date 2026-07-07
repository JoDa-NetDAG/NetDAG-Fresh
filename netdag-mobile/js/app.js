document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  let activeScanner = null;
  let currentProduct = null;
  let lastTouchTime = 0;

  function icon(name) {
    const icons = {
      scan: `<svg viewBox="0 0 24 24"><path d="M4 4h5v2H6v3H4V4zm11 0h5v5h-2V6h-3V4zM4 15h2v3h3v2H4v-5zm14 0h2v5h-5v-2h3v-3zM8 8h8v8H8V8z"/></svg>`,
      shield: `<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5.3 3.4 10.2 8 11 4.6-.8 8-5.7 8-11V5l-8-3z"/></svg>`,
      history: `<svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 1 1-8.2 5.3H2l3.6-3.6L9.2 8.3H6.8A7 7 0 1 0 13 5V3zm-1 5h2v5l4 2-.9 1.7-5.1-2.7V8z"/></svg>`,
      user: `<svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>`,
      flash: `<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z"/></svg>`,
      box: `<svg viewBox="0 0 24 24"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.3 5.8 3.2L12 10.7 6.2 7.5 12 4.3zM5 9.2l6 3.3v6.1l-6-3.3V9.2zm8 9.4v-6.1l6-3.3v6.1l-6 3.3z"/></svg>`,
      brain: `<svg viewBox="0 0 24 24"><path d="M9 2a4 4 0 0 0-4 4v.3A4.5 4.5 0 0 0 6 15v1a4 4 0 0 0 4 4h1V2H9zm6 0h-2v18h1a4 4 0 0 0 4-4v-1a4.5 4.5 0 0 0 1-8.7V6a4 4 0 0 0-4-4z"/></svg>`,
      search: `<svg viewBox="0 0 24 24"><path d="M10 4a6 6 0 0 1 4.8 9.6l4.8 4.8-1.4 1.4-4.8-4.8A6 6 0 1 1 10 4zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>`
    };

    return icons[name] || "";
  }

  function runAction(action) {
    if (!action) return;

    if (action === "open-scanner") {
      showScannerScreen();
      return;
    }

    if (action === "back-home") {
      showScanScreen();
      return;
    }

    if (action === "manual-search") {
      showManualSearchScreen();
      return;
    }

    if (action === "submit-search") {
      submitManualSearch();
      return;
    }

    if (action === "back-report") {
      showScanScreen();
      return;
    }

    if (action === "open-certificate") {
      if (currentProduct) showCertificateScreen(currentProduct);
      return;
    }

    if (action === "back-certificate") {
      if (currentProduct) showVerificationReportScreen(currentProduct);
    }
  }

  app.addEventListener("touchend", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    event.preventDefault();
    lastTouchTime = Date.now();
    runAction(target.dataset.action);
  }, { passive: false });

  app.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    if (Date.now() - lastTouchTime < 500) return;

    event.preventDefault();
    runAction(target.dataset.action);
  });

  function showSplashScreen() {
    app.innerHTML = `
      <section class="splash-screen">
        <div class="splash-glow"></div>
        <div class="splash-logo">
          <div class="logo-symbol">⬢</div>
          <h1>NET<span>DAG</span></h1>
        </div>
        <div class="splash-loader"><div></div></div>
      </section>
    `;

    setTimeout(showScanScreen, 2600);
  }

  function showScanScreen() {
    stopScanner();

    app.innerHTML = `
      <section class="scan-screen">
        <header class="scan-header">
          <div class="mini-logo wordmark-only">
            <h1>NET<span>DAG</span></h1>
          </div>
        </header>

        <section class="main-scan-area">
          <button type="button" class="big-scan-button" data-action="open-scanner">
            ${icon("scan")}
          </button>
          <h2>Scan</h2>
          <p>QR Code • Barcode • NFC</p>
        </section>

        <nav class="bottom-nav">
          <button type="button" class="active">${icon("scan")}<span>Scan</span></button>
          <button type="button">${icon("shield")}<span>Guardian</span></button>
          <button type="button">${icon("history")}<span>History</span></button>
          <button type="button">${icon("user")}<span>Account</span></button>
        </nav>
      </section>
    `;
  }

  function showScannerScreen() {
    app.innerHTML = `
      <section class="scanner-screen live-camera-mode">
        <header class="scanner-top overlay-top">
          <button type="button" data-action="back-home">←</button>
          <h1>Scan</h1>
          <span></span>
        </header>

        <section class="live-camera-view">
          <div class="scan-frame">
  <div id="reader" class="camera-reader"></div>
  <span></span>
</div>

          <p class="scan-instruction">
            Align QR code or barcode within the frame
          </p>

          <button type="button" class="manual-search-btn" data-action="manual-search">
            Can't scan? Search manually
          </button>
        </section>
      </section>
    `;

    startCameraScanner();
  }

 function startCameraScanner() {
  if (!window.Html5Qrcode) {
    console.error("Html5Qrcode not loaded");
    return;
  }

  activeScanner = new Html5Qrcode("reader");

  Html5Qrcode.getCameras()
    .then((cameras) => {
      if (!cameras || cameras.length === 0) {
        console.error("No camera found");
        return;
      }

      const backCamera =
        cameras.find((camera) =>
          camera.label.toLowerCase().includes("back") ||
          camera.label.toLowerCase().includes("rear") ||
          camera.label.toLowerCase().includes("environment")
        ) || cameras[cameras.length - 1];

      return activeScanner.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: undefined,
          aspectRatio: 1.7777778,
          disableFlip: false
        },
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {}
      );
    })
    .catch((err) => {
      console.error("Camera start failed:", err);
    });
}

  function stopScanner() {
    if (!activeScanner) return;

    activeScanner.stop()
      .then(() => {
        if (activeScanner) activeScanner.clear();
      })
      .catch(() => {})
      .finally(() => {
        activeScanner = null;
      });
  }

  function handleSuccessfulScan(scannedCode) {
    stopScanner();

    const product = Guardian.verify(scannedCode);

    if (!product) {
      showProductNotFoundScreen(scannedCode);
      return;
    }

    currentProduct = product;
    showVerifyingProductScreen(currentProduct);
  }

  function showManualSearchScreen() {
    stopScanner();

    app.innerHTML = `
      <section class="manual-search-screen">
        <header class="verification-header">
          <button type="button" data-action="open-scanner">←</button>
          <h1>Search Product</h1>
        </header>

        <section class="manual-search-card">
          <div class="manual-search-icon">
            ${icon("search")}
          </div>

          <h2>Manual Verification</h2>
          <p>
            Enter a product code, barcode, QR ID, product name, brand, or on-chain ID.
          </p>

          <input
            id="manualSearchInput"
            class="manual-search-input"
            type="text"
            placeholder="e.g. NDG-FASHION-000001"
            autocomplete="off"
          />

          <button type="button" class="manual-search-submit" data-action="submit-search">
            Verify Product
          </button>

          <p id="manualSearchError" class="manual-search-error"></p>
        </section>
      </section>
    `;

    const input = document.getElementById("manualSearchInput");

    setTimeout(() => {
      if (input) input.focus();
    }, 250);

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitManualSearch();
      }
    });
  }

  function submitManualSearch() {
    const input = document.getElementById("manualSearchInput");
    const error = document.getElementById("manualSearchError");

    if (!input) return;

    const query = input.value.trim();

    if (!query) {
      if (error) error.textContent = "Please enter a product code or product name.";
      input.focus();
      return;
    }

    const product = Guardian.search(query);

    if (!product) {
      if (error) {
       "No trusted product record found. Please check the code, name, barcode, or on-chain ID and try again."; 
      }
      return;
    }

    currentProduct = product;
    showVerifyingProductScreen(currentProduct);
  }

  function showProductNotFoundScreen(scannedCode) {
    app.innerHTML = `
      <section class="manual-search-screen">
        <header class="verification-header">
          <button type="button" data-action="open-scanner">←</button>
          <h1>Product Not Found</h1>
        </header>

        <section class="manual-search-card">
          <div class="manual-search-icon warning-icon">
            ${icon("shield")}
          </div>

          <h2>No Trusted Record Found</h2>
          <p>
            NetDAG could not find a trusted record for this scan.
          </p>

          <div class="not-found-code">
            ${scannedCode || "Unknown scan"}
          </div>

          <button type="button" class="manual-search-submit" data-action="manual-search">
            Search Manually
          </button>
        </section>
      </section>
    `;
  }

  function showVerifyingProductScreen(product) {
    app.innerHTML = `
      <section class="building-screen">
        <div class="building-logo">NET<span>DAG</span></div>

        <h2>Verifying Product...</h2>

        <div class="trust-progress">
          <div class="trust-progress-bar"></div>
        </div>

        <div class="trust-steps">
          <p id="step1">Reading QR Code...</p>
          <p id="step2">Identifying Product...</p>
          <p id="step3">Detecting Product Category...</p>
          <p id="step4">Guardian Analysis...</p>
          <p id="step5">Preparing Verification Report...</p>
        </div>
      </section>
    `;

    ["step1", "step2", "step3", "step4", "step5"].forEach((id, index) => {
      setTimeout(() => {
        const step = document.getElementById(id);
        if (step) step.classList.add("active-step");
      }, 500 * index);
    });

    setTimeout(() => showVerificationReportScreen(product), 3200);
  }

  function getStatusClass(status) {
    const cleanStatus = String(status || "").toUpperCase();

    if (cleanStatus === "VERIFIED") return "status-green";
    if (cleanStatus === "WARNING") return "status-orange";
    if (cleanStatus === "NOT VERIFIED") return "status-red";

    return "status-orange";
  }

  function showVerificationReportScreen(product) {
    currentProduct = product;

    const analysisRows = Guardian.getCategoryAnalysis(product)
      .map(([label, value]) => `
        <p>
          <strong>${label}:</strong>
          <span>${value}</span>
        </p>
      `)
      .join("");

    app.innerHTML = `
      <section class="verification-screen">
        <header class="verification-header">
          <button type="button" data-action="back-report">←</button>
          <h1>Verification Report</h1>
        </header>

        <div class="verification-card ${getStatusClass(product.status)}">
          <div class="verification-status">
            <div class="verified-dot"></div>
            <h2>${product.status}</h2>
          </div>

          <h3>${product.name}</h3>
          <p class="category-label">${product.category}</p>
        </div>

        <section class="confidence-card">
          <h4>${icon("shield")} Guardian Confidence</h4>

          <div class="confidence-bar">
            <div class="confidence-fill" id="confidenceFill"></div>
          </div>

          <div class="confidence-score">
            <span id="confidenceScore">0</span>%
          </div>
        </section>

    <section class="details-card">
  <h4>${icon("shield")} Authenticity</h4>

  <p><strong>Status:</strong> <span>${product.status}</span></p>
  <p><strong>Risk:</strong> <span>${product.risk}</span></p>
  <p><strong>Trust Level:</strong> <span>${product.trustLabel}</span></p>
  <p><strong>Trust Score:</strong> <span>${product.trustScore}%</span></p>
  <p><strong>Trust Band:</strong> <span>${product.trustBand}</span></p>
  <p><strong>Evidence:</strong> <span>${product.evidenceStrength}</span></p>
  <p><strong>Evidence Sources:</strong> <span>${product.evidenceCount}</span></p>
  <p><strong>Guardian:</strong> <span>${product.guardianDecision}</span></p>
  <p><strong>Public Note:</strong> <span>${product.publicWarning}</span></p>
  <p><strong>Evidence Summary:</strong> <span>${product.evidenceSummary}</span></p>
  <p><strong>Certificate:</strong> <span>Digital Certificate Found</span></p>
</section>   

        <section class="details-card">
          <h4>${icon("box")} Product Details</h4>

          <p><strong>Brand:</strong> <span>${product.brand}</span></p>
          <p><strong>Category:</strong> <span>${product.category}</span></p>
          <p><strong>Country:</strong> <span>${product.country}</span></p>
          <p><strong>Manufacturer:</strong> <span>${product.manufacturer}</span></p>
          <p>
            <strong>On-chain ID:</strong>
            <button type="button" class="onchain-link" data-action="open-certificate">
              ${product.onchainId}
            </button>
          </p>
        </section>

    <section class="details-card">
  <h4>${icon("brain")} Guardian Brain</h4>

  <p><strong>Decision:</strong> <span>${product.guardianDecisionFinal}</span></p>
  <p><strong>Recommendation:</strong> <span>${product.guardianRecommendation}</span></p>
  <p><strong>Next Action:</strong> <span>${product.guardianNextAction}</span></p>

  <p><strong>Reasons:</strong></p>
  <ul>
    ${product.guardianReasons.map(r => `<li>${r}</li>`).join("")}
  </ul>

  ${
    product.guardianWarnings.length
      ? `
        <p><strong>Warnings:</strong></p>
        <ul>
          ${product.guardianWarnings.map(w => `<li>${w}</li>`).join("")}
        </ul>
      `
      : ""
  }
</section>

      </section>
    `;

    animateGuardianConfidence(product.guardianScore);
  }

  function showCertificateScreen(product) {
  currentProduct = product;

  app.innerHTML = `
    <section class="certificate-screen">
      <header class="verification-header">
        <button type="button" data-action="back-certificate">←</button>
        <h1>Digital Certificate</h1>
      </header>

      <section class="certificate-hero-card">
        <div class="certificate-brand">NET<span>DAG</span></div>

        <div class="certificate-seal">
          ${icon("shield")}
        </div>

        <h2>Digital Provenance Certificate</h2>
        <p class="certificate-valid">✓ ${product.certificateStatus}</p>

        <div class="certificate-main-id">
          ${product.certificateId}
        </div>

        <div class="certificate-score-row">
          <div>
            <strong>${product.trustScore}%</strong>
            <span>Trust Score</span>
          </div>
          <div>
            <strong>${product.trustBand}</strong>
            <span>Trust Band</span>
          </div>
        </div>
      </section>

      <section class="details-card">
        <h4>${icon("box")} Certified Product</h4>
        <p><strong>Product:</strong> <span>${product.name}</span></p>
        <p><strong>Brand:</strong> <span>${product.brand}</span></p>
        <p><strong>Category:</strong> <span>${product.category}</span></p>
        <p><strong>Manufacturer:</strong> <span>${product.manufacturer}</span></p>
        <p><strong>Origin:</strong> <span>${product.origin}</span></p>
        <p><strong>Batch:</strong> <span>${product.batch}</span></p>
      </section>

      <section class="details-card">
        <h4>${icon("shield")} Guardian Verification</h4>
        <p><strong>Status:</strong> <span>${product.status}</span></p>
        <p><strong>Evidence:</strong> <span>${product.evidenceStrength}</span></p>
        <p><strong>Decision:</strong> <span>${product.guardianDecision}</span></p>
        <p><strong>Public Note:</strong> <span>${product.publicWarning}</span></p>
      </section>

      <section class="details-card">
        <h4>${icon("brain")} Certificate Details</h4>
        <p><strong>On-chain ID:</strong> <span>${product.onchainId}</span></p>
        <p><strong>Record ID:</strong> <span>${product.recordId}</span></p>
        <p><strong>Fingerprint:</strong> <span>${product.certificateFingerprint}</span></p>
        <p><strong>Issued:</strong> <span>${new Date(product.certificateIssuedAt).toLocaleString()}</span></p>
        <p><strong>Version:</strong> <span>${product.certificateVersion}</span></p>
        <p><strong>Network:</strong> <span>NetDAG Provenance Network</span></p>
      </section>
    </section>
  `;
}

  function animateGuardianConfidence(targetScore) {
    const scoreEl = document.getElementById("confidenceScore");
    const fillEl = document.getElementById("confidenceFill");

    if (!scoreEl || !fillEl) return;

    let score = 0;

    const timer = setInterval(() => {
      score += 1;
      scoreEl.textContent = score;
      fillEl.style.width = `${score}%`;

      if (score >= targetScore) {
        clearInterval(timer);
      }
    }, 18);
  }

  showSplashScreen();
});