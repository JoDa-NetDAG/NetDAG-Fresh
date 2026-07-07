const Evidence = {
  weights: {
    manufacturer: 30,
    certificate: 25,
    barcode: 20,
    origin: 10,
    batch: 10,
    productName: 5,
    nutrition: 5,
    ingredients: 5,
    certification: 10
  },

  evaluate(product) {
    if (!product) return null;

    const evidence = product.evidence || {};
    const evidenceKeys = Object.keys(evidence);

    const evidenceScore = this.calculateEvidenceScore(evidence);

    return {
      evidenceCount: evidenceKeys.length,
      evidenceScore,
      evidenceStrength: this.getEvidenceStrength(evidenceScore),

      hasManufacturerEvidence: this.hasEvidence(evidence, "manufacturer"),
      hasBarcodeEvidence: this.hasEvidence(evidence, "barcode"),
      hasCertificateEvidence: this.hasEvidence(evidence, "certificate"),
      hasOriginEvidence: this.hasEvidence(evidence, "origin"),

      scoreBreakdown: this.getScoreBreakdown(evidence),
      summary: this.getSummary(evidenceScore)
    };
  },

  hasEvidence(evidence, key) {
    return Boolean(evidence && evidence[key]);
  },

  calculateEvidenceScore(evidence) {
    let score = 0;

    Object.keys(evidence || {}).forEach((key) => {
      score += this.weights[key] || 3;
    });

    return Math.min(score, 100);
  },

  getScoreBreakdown(evidence) {
    return Object.keys(evidence || {}).map((key) => {
      return {
        source: key,
        value: evidence[key],
        weight: this.weights[key] || 3
      };
    });
  },

  getEvidenceStrength(score) {
    if (score >= 80) return "STRONG";
    if (score >= 55) return "GOOD";
    if (score >= 25) return "LIMITED";
    return "LOW";
  },

  getSummary(score) {
    if (score >= 80) {
      return "Strong evidence supports this product record.";
    }

    if (score >= 55) {
      return "Good evidence supports this product record.";
    }

    if (score >= 25) {
      return "Limited evidence is available for this product record.";
    }

    return "Very limited evidence is available for this product record.";
  }
};