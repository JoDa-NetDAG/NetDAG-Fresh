document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("provRegisterForm");
  const clearBtn = document.getElementById("provClearBtn");
  const exportBtn = document.getElementById("provExportBtn");
  const importBtn = document.getElementById("provImportBtn");
  const importFileInput = document.getElementById("provImportFile");
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (err) {
      console.error("Record storage failed:", err);
      alert("Storage limit reached. Older browser demo records may need cleanup.");
      return false;
    }
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

  function getStorageInfo() {
    const records = loadRecords();

    return {
      storageType: "browser-localStorage",
      storageVersion: "mvp-local-v1",
      totalRecords: records.length,
      estimatedSizeKB: Math.round(JSON.stringify(records).length / 1024)
    };
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

    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(json);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    if (window.ethers) {
      return ethers.sha256(ethers.toUtf8Bytes(json)).replace(/^0x/, "");
    }

    throw new Error("SHA256 is not available in this browser.");
  }

  async function checkRecordIntegrity(record) {
    if (!record || !record.hash) return "unknown";

    const canonicalPayload = buildCanonicalPayload(record);
    const recalculatedHash = await sha256FromObject(canonicalPayload);

    return recalculatedHash === record.hash ? "valid" : "tampered";
  }

  async function updateSummary(record) {
    const integrity = await checkRecordIntegrity(record);

    let integrityText = "Unknown";
    if (integrity === "valid") integrityText = "Valid Record";
    if (integrity === "tampered") integrityText = "Possible Tampering Detected";

    summaryGrid.innerHTML = `
      <div>Record ID</div><div>${record.recordId}</div>
      <div>Product</div><div>${record.productName || "—"}</div>
      <div>SKU</div><div>${record.sku || "—"}</div>
      <div>Batch</div><div>${record.batch || "—"}</div>
      <div>Origin</div><div>${record.origin || "—"}</div>
      <div>Issuer</div><div>${record.issuer || "—"}</div>
      <div>Created</div><div>${record.createdAt || "—"}</div>
      <div>Integrity</div><div>${integrityText}</div>
    `;
  }

  function renderRecordsHistory() {
    const historyBox = document.getElementById("provRecordsHistory");
    if (!historyBox) return;

    const searchInput = document.getElementById("provHistorySearch");

    const searchTerm = (searchInput?.value || "").toLowerCase().trim();

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.addEventListener("input", () => {
        renderRecordsHistory();
      });

      searchInput.dataset.bound = "true";
    }

    const records = loadRecords()
      .filter((record) => {
        if (!searchTerm) return true;

        return (
          (record.productName || "").toLowerCase().includes(searchTerm) ||
          (record.recordId || "").toLowerCase().includes(searchTerm) ||
          (record.batch || "").toLowerCase().includes(searchTerm) ||
          (record.manufacturer || "").toLowerCase().includes(searchTerm)
        );
      })
      .slice(0, 5);

    const info = getStorageInfo();

    if (!records.length) {
      historyBox.innerHTML = `<p class="prov-small">No recent records yet.</p>`;
      return;
    }

    historyBox.innerHTML = `
      <p class="prov-small">
        Storage: ${info.totalRecords} records • approx. ${info.estimatedSizeKB} KB • ${info.storageType}
      </p>
    ` + records.map((record) => `
      <div class="prov-history-item" data-record-id="${record.recordId || ""}">
        <strong>${record.productName || "Unknown Product"}</strong><br>
        <span class="prov-mono">${record.recordId || "—"}</span><br>
        <small>Batch: ${record.batch || "—"} • ${record.createdAt || "—"}</small>
      </div>
    `).join("");

    historyBox.querySelectorAll(".prov-history-item").forEach((item) => {
      item.addEventListener("click", () => {
        const recordId = item.dataset.recordId;
        if (!recordId) return;

        if (verifyIdInput) {
          verifyIdInput.value = recordId;
        }

        const verifySection = document.getElementById("provVerifyForm");
        if (verifySection) {
          verifySection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        setTimeout(() => {
          const verifyForm = document.getElementById("provVerifyForm");
          if (verifyForm) {
            verifyForm.requestSubmit();
          }
        }, 400);
      });
    });
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
      <div>Integrity</div><div>—</div>
    `;

    hashOutput.textContent = "Hash not generated yet.";
    qrOutput.innerHTML = `QR code will appear here in the next step.`;

    anchorStatus.className = "prov-status prov-status-pending";
    anchorStatus.textContent = "Not anchored yet";
    anchorText.textContent = "Blockchain anchoring will be connected in a later step.";

    hideAnchorLink();
  }

  async function restoreAnchorState() {
    const record = loadCurrentRecord();
    if (!record) return;

    await updateSummary(record);

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

      const lightweightRecord = {
        ...record,
        productImage: record.productImage || ""
      };

      if (
        lightweightRecord.productImage &&
        lightweightRecord.productImage.length > 250000
      ) {
        lightweightRecord.productImage = "";
      }

      if (existingIndex >= 0) {
        records[existingIndex] = {
          ...records[existingIndex],
          ...lightweightRecord
        };
      } else {
        records.unshift(lightweightRecord);
      }

      saveRecords(records);
      saveCurrentRecord(lightweightRecord);

      anchorStatus.className = "prov-status prov-status-success";
      anchorStatus.textContent = "Anchored on BSC";
      anchorText.textContent = `Success. Tx hash: ${tx.hash}`;
      showAnchorLink(tx.hash);

      if (verifyIdInput) {
        verifyIdInput.value = record.recordId;
      }

      hashOutput.textContent = record.hash;
      await updateSummary(record);

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
      productImage: "",
      storageVersion: "mvp-local-v1",
      storageType: "browser-localStorage",
      createdAt: new Date().toISOString()
    };

    const imageFile = document.getElementById("provProductImage")?.files?.[0];

    if (imageFile) {
      if (imageFile.size > 250000) {
        alert("Logo image too large. Please use an image below 250KB.");
        return;
      }

      try {
        record.productImage = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result || "");
          reader.onerror = () => reject(new Error("Logo image could not be read."));

          reader.readAsDataURL(imageFile);
        });
      } catch (err) {
        alert(err.message || "Logo image could not be read.");
        return;
      }
    }

    try {
      const canonicalPayload = buildCanonicalPayload(record);
      record.hash = await sha256FromObject(canonicalPayload);

      const records = loadRecords();
      records.unshift(record);

      saveRecords(records);
      saveCurrentRecord(record);
      renderRecordsHistory();

      await updateSummary(record);

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
      hashOutput.textContent = err.message || "SHA256 generation failed.";

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

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const records = loadRecords();

      if (!records.length) {
        alert("No records available to export.");
        return;
      }

      const dataStr = JSON.stringify(records, null, 2);

      const blob = new Blob([dataStr], {
        type: "application/json"
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "netdag-provenance-records.json";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener("click", () => {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedRecords = JSON.parse(text);

        if (!Array.isArray(importedRecords)) {
          throw new Error("Invalid backup format");
        }

        const checkedRecords = [];

        for (const record of importedRecords) {
          const integrity = await checkRecordIntegrity(record);

          checkedRecords.push({
            ...record,
            integrityStatus: integrity
          });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedRecords));

        renderRecordsHistory();

        const validCount = checkedRecords.filter((r) => r.integrityStatus === "valid").length;
        const tamperedCount = checkedRecords.filter((r) => r.integrityStatus === "tampered").length;
        const unknownCount = checkedRecords.filter((r) => r.integrityStatus === "unknown").length;

        alert(
          `Import completed.\n\nValid: ${validCount}\nTampered: ${tamperedCount}\nUnknown: ${unknownCount}`
        );
      } catch (err) {
        console.error(err);
        alert("Import failed. Invalid JSON backup file.");
      }

      importFileInput.value = "";
    });
  }

  if (anchorBtn) {
    anchorBtn.addEventListener("click", anchorCurrentRecord);
  }

  resetPreview();

restoreAnchorState().then(() => {
  renderRecordsHistory();
  });
});