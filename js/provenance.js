document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("provRegisterForm");
  const clearBtn = document.getElementById("provClearBtn");
  const anchorBtn = document.getElementById("provAnchorBtn");

  const summaryGrid = document.getElementById("provSummaryGrid");
  const hashOutput = document.getElementById("provHashOutput");
  const qrOutput = document.getElementById("provQrOutput");
  const anchorStatus = document.getElementById("provAnchorStatus");
  const anchorText = document.getElementById("provAnchorText");
  const verifyIdInput = document.getElementById("provVerifyId");
  const anchorLinkWrap = document.getElementById("provAnchorLinkWrap");
  const anchorLink = document.getElementById("provAnchorLink");

  const BSC_TESTNET_TX_BASE = "https://testnet.bscscan.com/tx/";
  const STORAGE_KEY = "netdag_provenance_records_v1";
  const CURRENT_KEY = "netdag_current_provenance_record_v1";
  const BSC_TESTNET_CHAIN_ID = "0x61";

  const CONTRACT_ADDRESS =
  window.NDG_CONFIG?.PROVENANCE_ADDRESS ||
  "0x5edd83151c03fad61004214cb895832cde322b67";

  const CONTRACT_ABI = [
    "function anchorRecord(string recordId, string hashValue) external",
    "function getAnchor(string recordId) external view returns (string storedRecordId, string storedHash, uint256 storedTimestamp, address storedAnchoredBy)",
    "function isAnchored(string recordId) external view returns (bool)"
  ];

  if (!registerForm) return;

  function loadRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function saveCurrentRecord(record) {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(record));
  }

  function loadCurrentRecord() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_KEY)) || null;
    } catch {
      return null;
    }
  }

  function generateRecordId() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `NDG-PROV-${stamp}-${rand}`;
  }

  function buildCanonicalPayload(record) {
    return {
      recordId: record.recordId || "",
      productName: record.productName || "",
      sku: record.sku || "",
      batch: record.batch || "",
      serial: record.serial || "",
      manufacturer: record.manufacturer || "",
      origin: record.origin || "",
      shipment: record.shipment || "",
      productionDate: record.productionDate || "",
      issuer: record.issuer || "",
      description: record.description || "",
      createdAt: record.createdAt || ""
    };
  }

  async function sha256FromObject(obj) {
    const json = JSON.stringify(obj);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function updateSummary(record) {
    summaryGrid.innerHTML = `
      <div>Record ID</div><div>${record.recordId}</div>
      <div>Product</div><div>${record.productName || "—"}</div>
      <div>SKU</div><div>${record.sku || "—"}</div>
      <div>Batch</div><div>${record.batch || "—"}</div>
      <div>Origin</div><div>${record.origin || "—"}</div>
      <div>Issuer</div><div>${record.issuer || "—"}</div>
      <div>Created</div><div>${record.createdAt || "—"}</div>
    `;
  }

  function renderQr(record) {
  if (!qrOutput) return;

  qrOutput.innerHTML = "";

  const verifyUrl = `${window.location.origin}/provenance.html?id=${encodeURIComponent(record.recordId)}#prov-mvp-demo`;

  const qrWrap = document.createElement("div");
  qrWrap.className = "prov-qr-wrap";

  const qrCanvasHolder = document.createElement("div");
  qrCanvasHolder.className = "prov-qr-canvas";

  const qrLabel = document.createElement("div");
  qrLabel.className = "prov-small";
  qrLabel.style.textAlign = "center";
  qrLabel.innerHTML = `
    <strong>Verification Link</strong><br>
    <a href="${verifyUrl}" target="_blank" rel="noopener" class="prov-mono">
      ${record.recordId}
    </a>
  `;

  qrWrap.appendChild(qrCanvasHolder);
  qrWrap.appendChild(qrLabel);
  qrOutput.appendChild(qrWrap);

  if (typeof QRCode !== "undefined") {
    new QRCode(qrCanvasHolder, {
      text: verifyUrl,
      width: 170,
      height: 170
    });
  } else {
    qrCanvasHolder.innerHTML = `<div class="prov-small">QR library not loaded.</div>`;
  }
}

  function hideAnchorLink() {
    if (anchorLinkWrap) anchorLinkWrap.style.display = "none";
    if (anchorLink) anchorLink.href = "#";
  }

  function showAnchorLink(txHash) {
    if (!anchorLinkWrap || !anchorLink || !txHash) return;
    anchorLink.href = `${BSC_TESTNET_TX_BASE}${txHash}`;
    anchorLinkWrap.style.display = "block";
  }

  function resetPreview() {
    summaryGrid.innerHTML = `
      <div>Record ID</div><div>—</div>
      <div>Product</div><div>—</div>
      <div>SKU</div><div>—</div>
      <div>Batch</div><div>—</div>
      <div>Origin</div><div>—</div>
      <div>Issuer</div><div>—</div>
      <div>Created</div><div>—</div>
    `;

    hashOutput.textContent = "Hash not generated yet.";
    qrOutput.innerHTML = `QR code will appear here in the next step.`;

    anchorStatus.className = "prov-status prov-status-pending";
    anchorStatus.textContent = "Not anchored yet";
    anchorText.textContent = "Blockchain anchoring will be connected in a later step.";

    hideAnchorLink();
  }

  function restoreAnchorState() {
    const record = loadCurrentRecord();
    if (!record) return;

    updateSummary(record);

    if (record.hash) {
      hashOutput.textContent = record.hash;
      renderQr(record);
    }

    if (verifyIdInput && record.recordId) {
      verifyIdInput.value = record.recordId;
    }

    if (record.txHash) {
      anchorStatus.className = "prov-status prov-status-success";
      anchorStatus.textContent = "Anchored on BSC";
      anchorText.innerHTML = `Success. Tx hash: <a href="${BSC_TESTNET_TX_BASE}${record.txHash}" target="_blank" rel="noopener">${record.txHash}</a>`;
      showAnchorLink(record.txHash);
      return;
    }

    if (record.recordId && record.hash) {
      anchorStatus.className = "prov-status prov-status-pending";
      anchorStatus.textContent = "Ready for anchoring";
      anchorText.textContent =
        "Record created successfully. Real SHA256 hash generated. QR code generated. Next step: anchor hash on BSC testnet.";
    }
  }

  async function ensureBscTestnet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found. Please open this page inside MetaMask browser.");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });

  let currentChainId = await window.ethereum.request({
    method: "eth_chainId"
  });

  currentChainId = String(currentChainId).toLowerCase();

  if (currentChainId === BSC_TESTNET_CHAIN_ID.toLowerCase()) {
    return true;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_TESTNET_CHAIN_ID }]
    });

    return true;
  } catch (err) {
    console.error("Network switch failed:", err);
    throw new Error("Please switch MetaMask to BNB Testnet and try again.");
  }
}

  async function anchorCurrentRecord() {
    const record = loadCurrentRecord();

    if (!record || !record.recordId || !record.hash) {
      anchorStatus.className = "prov-status prov-status-error";
      anchorStatus.textContent = "No record ready";
      anchorText.textContent = "Generate a record first before anchoring.";
      hideAnchorLink();
      return;
    }

    if (!window.ethereum || !window.ethers) {
      anchorStatus.className = "prov-status prov-status-error";
      anchorStatus.textContent = "Wallet unavailable";
      anchorText.textContent = "MetaMask or ethers failed to load.";
      hideAnchorLink();
      return;
    }

    try {
      anchorStatus.className = "prov-status prov-status-pending";
      anchorStatus.textContent = "Connecting wallet";
      anchorText.textContent = "Please approve wallet connection.";
      hideAnchorLink();

      await ensureBscTestnet();
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum, "any");
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      anchorStatus.className = "prov-status prov-status-pending";
      anchorStatus.textContent = "Submitting anchor";
      anchorText.textContent = "Please confirm the transaction in MetaMask.";

      const tx = await contract.anchorRecord(record.recordId, record.hash);
      const receipt = await tx.wait();

      record.txHash = tx.hash;
      record.anchorBlock = receipt.blockNumber;
      record.anchoredAt = new Date().toISOString();

      const records = loadRecords();
      const existingIndex = records.findIndex((item) => item.recordId === record.recordId);

      if (existingIndex >= 0) {
        records[existingIndex] = { ...records[existingIndex], ...record };
      } else {
        records.unshift(record);
      }

      saveRecords(records);
      saveCurrentRecord(record);

      anchorStatus.className = "prov-status prov-status-success";
      anchorStatus.textContent = "Anchored on BSC";
      anchorText.textContent = `Success. Tx hash: ${tx.hash}`;
      showAnchorLink(tx.hash);

      if (verifyIdInput) {
        verifyIdInput.value = record.recordId;
      }

      hashOutput.textContent = record.hash;
      updateSummary(record);

      setTimeout(() => {
        window.location.href = `provenance.html?id=${encodeURIComponent(record.recordId)}#prov-mvp-demo`;
      }, 1200);
    } catch (err) {
      console.error(err);
      anchorStatus.className = "prov-status prov-status-error";
      anchorStatus.textContent = "Anchor failed";
      anchorText.textContent = err.message || "Transaction failed.";
      hideAnchorLink();
    }
  }

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);

    const record = {
      recordId: generateRecordId(),
      productName: String(formData.get("productName") || "").trim(),
      sku: String(formData.get("sku") || "").trim(),
      batch: String(formData.get("batch") || "").trim(),
      serial: String(formData.get("serial") || "").trim(),
      manufacturer: String(formData.get("manufacturer") || "").trim(),
      origin: String(formData.get("origin") || "").trim(),
      shipment: String(formData.get("shipment") || "").trim(),
      productionDate: String(formData.get("productionDate") || "").trim(),
      issuer: String(formData.get("issuer") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const canonicalPayload = buildCanonicalPayload(record);
      record.hash = await sha256FromObject(canonicalPayload);

      const records = loadRecords();
      records.unshift(record);
      saveRecords(records);
      saveCurrentRecord(record);

      updateSummary(record);
      hashOutput.textContent = record.hash;
      renderQr(record);

      anchorStatus.className = "prov-status prov-status-pending";
      anchorStatus.textContent = "Ready for anchoring";
      anchorText.textContent =
        "Record created successfully. Real SHA256 hash generated. QR code generated. Next step: anchor hash on BSC testnet.";

      hideAnchorLink();

      if (verifyIdInput) {
        verifyIdInput.value = record.recordId;
      }
    } catch (err) {
      console.error("Provenance generation failed:", err);
      hashOutput.textContent = "SHA256 generation failed.";

      anchorStatus.className = "prov-status prov-status-error";
      anchorStatus.textContent = "Generation failed";
      anchorText.textContent = "The browser could not complete record generation.";
      hideAnchorLink();
    }
  });

  clearBtn.addEventListener("click", () => {
    registerForm.reset();
    localStorage.removeItem(CURRENT_KEY);
    resetPreview();
  });

  if (anchorBtn) {
    anchorBtn.addEventListener("click", anchorCurrentRecord);
  }

  resetPreview();
  restoreAnchorState();
});