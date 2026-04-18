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
    printBtn: document.getElementById("provPrintBtn"),
    copyAllBtn: document.getElementById("provCopyAllBtn"),
    certVerifiedOn: document.getElementById("provCertVerifiedOn"),
  };

  function hideResult() {
    if (els.result) els.result.style.display = "none";
  }

  function showResult() {
    if (els.result) els.result.style.display = "block";
  }
 
  function printCertificate() {
  if (!els.result || els.result.style.display === "none") return;

  const certificateHtml = els.result.outerHTML;

  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NetDAG Provenance Certificate</title>
      <style>
        @page{
          size: auto;
          margin: 12mm;
        }

        *{
          box-sizing: border-box;
        }

        body{
          font-family: Arial, sans-serif;
          margin: 0;
          color: #000;
          background: #fff;
          line-height: 1.4;
        }

        .prov-result{
          display: block !important;
          background: #fff !important;
          color: #000 !important;
          border: 1px solid #ccc !important;
          box-shadow: none !important;
          border-radius: 12px;
          padding: 20px;
          width: 100%;
          max-width: 100%;
        }

        .prov-cert-header{
          margin-bottom: 18px;
        }

        .prov-badge{
          display: inline-block;
          padding: 6px 12px;
          border: 1px solid #000;
          border-radius: 999px;
          color: #000 !important;
          background: #fff !important;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .prov-cert-title{
          margin: 0 0 10px;
          color: #000 !important;
          font-size: 24px;
          line-height: 1.2;
        }

        .prov-cert-meta{
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .prov-cert-meta-item{
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 14px;
        }

        .prov-cert-meta-label{
          font-weight: 700;
          color: #000 !important;
        }

        .prov-cert-meta-value{
          color: #000 !important;
        }

        .prov-cert-grid{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .prov-cert-item{
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #fff !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .prov-cert-item-full{
          grid-column: 1 / -1;
        }

        .prov-cert-label{
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #000 !important;
        }

        .prov-cert-value{
          display: block;
          color: #000 !important;
          word-break: break-word;
          overflow-wrap: anywhere;
          line-height: 1.5;
        }

        .prov-cert-footer{
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #ccc;
          font-size: 13px;
          color: #000 !important;
          text-align: center;
        }

        .prov-copy-btn,
        #provCopyIdBtn,
        #provCopyHashBtn,
        #provCopyOwnerBtn,
        #provPrintBtn,
        #provCopyAllBtn,
        .prov-form-actions,
        #provVerifyStatus{
          display: none !important;
        }

        @media print{
          body{
            margin: 0;
          }

          .prov-result{
            border: 1px solid #ccc !important;
          }
        }
      </style>
    </head>
    <body>
      ${certificateHtml}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

  if (els.printBtn) {
  els.printBtn.addEventListener("click", printCertificate);
  }

  if (els.copyAllBtn) {
  els.copyAllBtn.addEventListener("click", copyFullCertificate);
}

  function copyFullCertificate() {
  if (!els.result || els.result.style.display === "none") return;

  const lines = [
  "NetDAG Provenance Certificate",
  "------------------------------",
  `Status: ${els.badge ? els.badge.textContent.trim() : ""}`,
  "Network: BNB Smart Chain Testnet",
  `Verified on: ${els.certVerifiedOn ? els.certVerifiedOn.textContent.trim() : ""}`,
  "Issued by: NetDAG Provenance",
  "",
  `Company: ${els.outCompany ? els.outCompany.textContent.trim() : ""}`,
  `Issuer: ${els.outIssuer ? els.outIssuer.textContent.trim() : ""}`,
  `Product: ${els.outProduct ? els.outProduct.textContent.trim() : ""}`,
  `Product ID: ${els.outId ? els.outId.textContent.trim() : ""}`,
  `Batch: ${els.outBatch ? els.outBatch.textContent.trim() : ""}`,
  `Serial Number: ${els.outSerial ? els.outSerial.textContent.trim() : ""}`,
  `Origin: ${els.outOrigin ? els.outOrigin.textContent.trim() : ""}`,
  `Production Date: ${els.outProdDate ? els.outProdDate.textContent.trim() : ""}`,
  `Shipment: ${els.outShipment ? els.outShipment.textContent.trim() : ""}`,
  `Verification Hash: ${els.outHash ? els.outHash.textContent.trim() : ""}`,
  `Verification Time: ${els.outTime ? els.outTime.textContent.trim() : ""}`,
  `Anchored By: ${els.outOwner ? els.outOwner.textContent.trim() : ""}`,
  "",
  "Generated by NetDAG Provenance • BNB Smart Chain Testnet"
];
  const fullText = lines.join("\n");

  navigator.clipboard.writeText(fullText).then(() => {
    setStatus("Full certificate copied.", "success");
  }).catch(() => {
    setStatus("Could not copy full certificate.", "error");
  });
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
      shipment: localRecord.shipment || "Not provided"
    };
  }

  async function getReadContract() {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }

    const rpcUrl = "https://bsc-testnet.publicnode.com";
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
    if (els.certVerifiedOn) els.certVerifiedOn.textContent = formatTimestamp(data.storedTimestamp);
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
  if (els.outCompany) els.outCompany.textContent = "Not provided";
  if (els.outIssuer) els.outIssuer.textContent = "Not provided";
  if (els.outProduct) els.outProduct.textContent = "Not provided";
  if (els.outBatch) els.outBatch.textContent = "Not provided";
  if (els.outSerial) els.outSerial.textContent = "Not provided";
  if (els.outProdDate) els.outProdDate.textContent = "Not provided";
  if (els.outOrigin) els.outOrigin.textContent = "Not provided";
  if (els.outShipment) els.outShipment.textContent = "Not provided";

  if (els.outId) els.outId.textContent = productId || "Not provided";
  if (els.outHash) els.outHash.textContent = "No on-chain record found";
  if (els.outTime) els.outTime.textContent = "Not available";
  if (els.outOwner) els.outOwner.textContent = "Not available";
  if (els.certVerifiedOn) els.certVerifiedOn.textContent = "Not available";

  if (els.badge) els.badge.textContent = "Record Not Found";

  showResult();
  setStatus("No on-chain provenance record was found for this Product ID.", "error");
}

   function clearResult() {
  if (els.outCompany) els.outCompany.textContent = "";
  if (els.outIssuer) els.outIssuer.textContent = "";
  if (els.outProduct) els.outProduct.textContent = "";
  if (els.outBatch) els.outBatch.textContent = "";
  if (els.outSerial) els.outSerial.textContent = "";
  if (els.outProdDate) els.outProdDate.textContent = "";
  if (els.outOrigin) els.outOrigin.textContent = "";
  if (els.outShipment) els.outShipment.textContent = "";
  if (els.outId) els.outId.textContent = "";
  if (els.outHash) els.outHash.textContent = "";
  if (els.outTime) els.outTime.textContent = "";
  if (els.outOwner) els.outOwner.textContent = "";
  if (els.certVerifiedOn) els.certVerifiedOn.textContent = "";
  if (els.badge) els.badge.textContent = "";
}

  async function verifyProduct() {
    const productId = els.input?.value.trim().toUpperCase();
  if (els.input) els.input.value = productId;

    clearResult();
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

  const target = document.getElementById("prov-mvp-demo");
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

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

 if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoVerifyFromURL);
} else {
  autoVerifyFromURL();
}
})();