const Guardian = {
  verify(scannedCode) {
    return this.search(scannedCode);
  },

  search(query) {
    const cleanQuery = String(query || "").trim().toLowerCase();

    if (!cleanQuery) return null;

    const products = NetDAGDatabase.products;

    const exactMatch = Object.values(products).find((product) => {
      return [
        product.productId,
        product.barcode,
        product.sku,
        product.onchainId,
        product.recordId
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === cleanQuery);
    });

    if (exactMatch) {
      return this.prepareResult(exactMatch, query);
    }

    const partialMatch = Object.values(products).find((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.manufacturer,
        product.country,
        product.origin,
        product.trustStatus,
        ...(product.keywords || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(cleanQuery);
    });

    if (partialMatch) {
      return this.prepareResult(partialMatch, query);
    }

    return null;
  },

   prepareResult(product, query) {
  const evidence = Evidence.evaluate(product);
  const integrity = Integrity.evaluate(product);
  const trustScore = Trust.calculate(product, integrity, evidence);
  const certificate = Certificate.generate({
  ...product,
  trustScore,
  trustBand: Trust.getTrustBand(trustScore),
  reviewRequired: integrity.reviewRequired,
  conflictFlag: integrity.conflictFlag
});

const brain = GuardianBrain.analyze({
  ...product,
  trustScore,
  trustBand: Trust.getTrustBand(trustScore),
  evidenceStrength: evidence.evidenceStrength,
  evidenceCount: evidence.evidenceCount,
  hasManufacturerEvidence: evidence.hasManufacturerEvidence,
  hasBarcodeEvidence: evidence.hasBarcodeEvidence,
  hasCertificateEvidence: evidence.hasCertificateEvidence,
  hasOriginEvidence: evidence.hasOriginEvidence,
  reviewRequired: integrity.reviewRequired,
  conflictFlag: integrity.conflictFlag,
  fraudStatus: integrity.fraudStatus
});



  return {
    ...product,
    scannedCode: query,
    guardianDecision: this.getGuardianDecision(product),

    trustLabel: this.getTrustLabel(integrity.trustStage),

    trustScore,
    trustBand: Trust.getTrustBand(trustScore),

    evidenceStrength: evidence.evidenceStrength,
    evidenceCount: evidence.evidenceCount,
    evidenceSummary: evidence.summary,
    hasManufacturerEvidence: evidence.hasManufacturerEvidence,
    hasBarcodeEvidence: evidence.hasBarcodeEvidence,
    hasCertificateEvidence: evidence.hasCertificateEvidence,
    hasOriginEvidence: evidence.hasOriginEvidence,

    certificate,
   certificateId: certificate.certificateId,
   certificateStatus: certificate.status,
   certificateFingerprint: certificate.fingerprint,
   certificateIssuedAt: certificate.issuedAt,
   certificateVersion: certificate.version,
   certificateVerifyUrl: certificate.verifyUrl,

   guardianBrain: brain,
   guardianDecisionFinal: brain.decision,
   guardianRecommendation: brain.recommendation,
   guardianReasons: brain.reasons,
   guardianWarnings: brain.warnings,
   guardianNextAction: brain.nextAction,

    publicWarning: integrity.publicMessage,
    fraudStatus: integrity.fraudStatus,
    reviewRequired: integrity.reviewRequired,
    conflictFlag: integrity.conflictFlag
  };
},

  getGuardianDecision(product) {
    if (product.status === "VERIFIED" && product.trustStatus === "NETDAG_VERIFIED") {
      return "Strong verification evidence found.";
    }

    if (product.conflictFlag) {
      return "Conflicting product information detected.";
    }

    if (product.reviewRequired) {
      return "Product record requires additional review.";
    }

    if (product.status === "WARNING") {
      return "Verification is limited. Further confirmation is recommended.";
    }

    return "Product information available.";
  },

  getTrustLabel(trustStatus) {
    const labels = {
      SUBMITTED: "Submitted Record",
      AUTO_VALIDATED: "Auto Validated",
      EVIDENCE_CONFIRMED: "Evidence Confirmed",
      TRUSTED_PRODUCT: "Trusted Product",
      NETDAG_VERIFIED: "NetDAG Verified"
    };

    return labels[trustStatus] || "Limited Information";
  },

  getPublicWarning(product) {
    if (product.conflictFlag) {
      return "Conflicting information detected.";
    }

    if (product.reviewRequired) {
      return "Product record under review.";
    }

    if (product.trustStatus === "SUBMITTED") {
      return "Information currently limited.";
    }

    if (product.status === "WARNING") {
      return "Further verification recommended.";
    }

    return "No public warning.";
  },

  getCategoryAnalysis(product) {
    const category = product.category?.toLowerCase();

    const modules = {
      fashion: [
        ["Brand Match", "Confirmed"],
        ["Factory Origin", product.origin],
        ["Material Risk", "Low"],
        ["Authenticity Signal", product.trustLabel]
      ],

      medicine: [
        ["Batch Check", product.batch ? "Available" : "Missing"],
        ["Recall Check", product.risk],
        ["Evidence Level", product.trustLabel],
        ["Review Status", product.reviewRequired ? "Review Required" : "Clear"]
      ],

      food: [
        ["Nutrition Evidence", product.evidence?.nutrition || "Not Available"],
        ["Origin Evidence", product.evidence?.origin || "Not Available"],
        ["Sugar / Salt Risk", product.risk],
        ["Evidence Level", product.trustLabel]
      ],

      electronics: [
        ["Certification", product.evidence?.certification || "Limited"],
        ["Manufacturer Evidence", product.evidence?.manufacturer || "Limited"],
        ["Review Status", product.reviewRequired ? "Review Required" : "Clear"],
        ["Evidence Level", product.trustLabel]
      ],

      cosmetics: [
        ["Ingredient Evidence", product.evidence?.ingredients || "Limited"],
        ["Manufacturer Evidence", product.evidence?.manufacturer || "Limited"],
        ["Review Status", product.reviewRequired ? "Review Required" : "Clear"],
        ["Evidence Level", product.trustLabel]
      ]
    };

    return modules[category] || [
      ["Guardian Module", "Ready"],
      ["Category", product.category || "Unknown"],
      ["Evidence Level", product.trustLabel],
      ["Risk Signal", product.risk || "Pending"]
    ];
  }
};