(() => {
  const CONTRACT_ADDRESS = "0x5edd83151c03fad61004214cb895832cde322b67";

  const CONTRACT_ABI = [
    "function isAnchored(string) view returns (bool)",
    "function getAnchor(string) view returns (string storedRecordId, string storedHash, uint256 storedTimestamp, address storedAnchoredBy)"
  ];

  const STORAGE_KEY = "netdag_provenance_records_v1";

  const PRODUCT_METADATA = {
    "NDG-DEMO-001": {
      company: "SwissAlpineChoco AG",
      product: "Premium Dark Chocolate 70% – 100g Bar",
      batch: "BATCH-01",
      origin: "Switzerland",
      shipment: "Zürich → Denver"
    },
    "CHOC-ZRH-2025-001": {
      company: "SwissAlpineChoco AG",
      product: "Premium Dark Chocolate 70% – 100g Bar",
      batch: "BATCH-01",
      origin: "Switzerland",
      shipment: "Zürich → Denver"
    }
  };

  const els = {
    form: document.getElementById("provVerifyForm"),
    input: document.getElementById("provVerifyId"),
    result: document.getElementById("provResult"),
    badge: document.getElementById("provBadge"),
    status: document.getElementById("provVerifyStatus"),
    outCompany: document.getElementById("provOutCompany"),
    outIssuer: document.getElementById("provOutIssuer"),
    outProduct: document.getElementById("provOutProduct"),
    outProdDate: document.getElementById("provOutProdDate"),
    outId: document.getElementById("provOutId"),
    copyIdBtn: document.getElementById("provCopyIdBtn"),
    outBatch: document.getElementById("provOutBatch"),
    outSerial: document.getElementById("provOutSerial"),
    outOrigin: document.getElementById("provOutOrigin"),
    outShipment: document.getElementById("provOutShipment"),
    outHash: document.getElementById("provOutHash"),
    copyHashBtn: document.getElementById("provCopyHashBtn"),
    outTime: document.getElementById("provOutTime"),
    outOwner: document.getElementById("provOutOwner"),
    copyOwnerBtn: document.getElementById("provCopyOwnerBtn"),
  };

  function hideResult() {
    if (els.result) els.result.style.display = "none";
  }

  function showResult() {
    if (els.result) els.result.style.display = "block";
  }

  function setStatus(message, type = "pending") {
    if (!els.status) return;

    els.status.textContent = message;
    els.status.style.display = "inline-flex";
    els.status.className = "prov-status";

    if (type === "success") {
      els.status.classList.add("prov-status-success");
    } else if (type === "error") {
      els.status.classList.add("prov-status-error");
    } else {
      els.status.classList.add("prov-status-pending");
    }
  }

  function formatTimestamp(unixSeconds) {
    const n = Number(unixSeconds);
    if (!n) return "Unknown";
    return new Date(n * 1000).toLocaleString();
  }

  function loadLocalRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function getLocalMetadata(recordId) {
    const localRecord = loadLocalRecords().find((item) => item.recordId === recordId);
    if (!localRecord) return null;

    return {
      company: localRecord.manufacturer || "Not provided",
      issuer: localRecord.issuer || "Not provided",
      product: localRecord.productName || "Not provided",
      batch: localRecord.batch || "Not provided",
      serial: localRecord.serial || "Not provided",
      productionDate: localRecord.productionDate || "Not provided",
      origin: localRecord.origin || "Not provided",
      shipment: localRecord.shipment || "Not Provided"
    };
  }

  async function getReadContract() {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }

    const rpcUrl = "https://data-seed-prebsc-1-s1.binance.org:8545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }

  function fillResult(data) {
    const meta =
      getLocalMetadata(data.storedRecordId) ||
      PRODUCT_METADATA[data.storedRecordId] ||
      {};

    if (els.outCompany) els.outCompany.textContent = meta.company || "Not provided";
    if (els.outIssuer) els.outIssuer.textContent = meta.issuer || "Not provided";
    if (els.outProduct) els.outProduct.textContent = meta.product || "Not provided";
    if (els.outBatch) els.outBatch.textContent = meta.batch || "Not provided";
    if (els.outSerial) els.outSerial.textContent = meta.serial || "Not provided";
    if (els.outProdDate) els.outProdDate.textContent = meta.productionDate || "Not provided";
    if (els.outOrigin) els.outOrigin.textContent = meta.origin || "Not provided";
    if (els.outShipment) els.outShipment.textContent = meta.shipment || "Not provided";

    if (els.outId) els.outId.textContent = data.storedRecordId || "—";
    if (els.outHash) els.outHash.textContent = data.storedHash || "—";
    if (els.outTime) els.outTime.textContent = formatTimestamp(data.storedTimestamp);
    if (els.outOwner) els.outOwner.textContent = data.storedAnchoredBy || "—";

    if (els.badge) els.badge.textContent = "Authenticity Confirmed";

    showResult();
    setStatus("Verified successfully on BNB Smart Chain Testnet.", "success"); 
  }

async function copyRecordId() {
  const value = els.outId?.textContent?.trim();
  if (!value || value === "—") return;

  const originalText = els.copyIdBtn?.textContent || "Copy ID";

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }

    if (els.copyIdBtn) {
      els.copyIdBtn.textContent = "Copied";
      setTimeout(() => {
        els.copyIdBtn.textContent = originalText;
      }, 1200);
    }
  } catch (err) {
    console.error("Copy failed:", err);
  }
}

async function copyHash() {
  const value = els.outHash?.textContent?.trim();
  if (!value || value === "—" || value === "No record found") return;

  const originalText = els.copyHashBtn?.textContent || "Copy Hash";

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }

    if (els.copyHashBtn) {
      els.copyHashBtn.textContent = "Copied";
      setTimeout(() => {
        els.copyHashBtn.textContent = originalText;
      }, 1200);
    }
  } catch (err) {
    console.error("Copy hash failed:", err);
  }
}

async function copyOwner() {
  const value = els.outOwner?.textContent?.trim();
  if (!value || value === "—") return;

  const originalText = els.copyOwnerBtn?.textContent || "Copy Wallet";

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }

    if (els.copyOwnerBtn) {
      els.copyOwnerBtn.textContent = "Copied";
      setTimeout(() => {
        els.copyOwnerBtn.textContent = originalText;
      }, 1200);
    }
  } catch (err) {
    console.error("Copy wallet failed:", err);
  }
}

  function showNotFound(productId) {
    if (els.outCompany) els.outCompany.textContent = "—";
    if (els.outIssuer) els.outIssuer.textContent = "—";
    if (els.outProduct) els.outProduct.textContent = "—";
    if (els.outBatch) els.outBatch.textContent = "—";
    if (els.outSerial) els.outSerial.textContent = "—";
    if (els.outProdDate) els.outProdDate.textContent = "—";
    if (els.outOrigin) els.outOrigin.textContent = "—";
    if (els.outShipment) els.outShipment.textContent = "—";
    if (els.outId) els.outId.textContent = productId || "—";
    if (els.outHash) els.outHash.textContent = "No record found";
    if (els.outTime) els.outTime.textContent = "—";
    if (els.outOwner) els.outOwner.textContent = "—";

    if (els.badge) els.badge.textContent = "Record Not Found";

    showResult();
    setStatus("No on-chain provenance record was found for this Product ID.", "error");
  }

  async function verifyProduct() {
    const productId = els.input?.value.trim();

    hideResult();

    if (!productId) {
      setStatus("Please enter a Product ID first.", "error");
      return;
    }

    try {
      setStatus("Checking blockchain record...", "pending");

      const contract = await getReadContract();
      const anchored = await contract.isAnchored(productId);

      if (!anchored) {
        showNotFound(productId);
        return;
      }

      const record = await contract.getAnchor(productId);

      fillResult({
        storedRecordId: record.storedRecordId,
        storedHash: record.storedHash,
        storedTimestamp: record.storedTimestamp,
        storedAnchoredBy: record.storedAnchoredBy
      });
    } catch (err) {
      console.error("Provenance verify error:", err);
      setStatus("Verification failed. Please try again.", "error");
      hideResult();
    }
  }

  if (els.form) {
    els.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await verifyProduct();
    });
  }

  function autoVerifyFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id || !els.input) return;

    els.input.value = id;

    setTimeout(() => {
      verifyProduct();
    }, 400);
  }
if (els.copyIdBtn) {
  els.copyIdBtn.addEventListener("click", copyRecordId);
} 
if (els.copyHashBtn) {
  els.copyHashBtn.addEventListener("click", copyHash);
}
if (els.copyOwnerBtn) {
  els.copyOwnerBtn.addEventListener("click", copyOwner);
}
  document.addEventListener("DOMContentLoaded", autoVerifyFromURL);
})();