const Trust = {
  calculate(product, integrity, evidence) {
    if (!product || !integrity) return 0;

    let score = 50;

    score += this.getTrustStageScore(integrity.trustStage);
    score += this.getEvidenceScore(evidence);
    score -= this.getRiskPenalty(product, integrity);

    return Math.max(0, Math.min(100, score));
  },

  getTrustStageScore(trustStage) {
    const scores = {
      SUBMITTED: 5,
      AUTO_VALIDATED: 15,
      EVIDENCE_CONFIRMED: 25,
      TRUSTED_PRODUCT: 35,
      NETDAG_VERIFIED: 45
    };

    return scores[trustStage] || 0;
  },

 getEvidenceScore(evidence) {
  if (!evidence) return 0;

  return Math.min(evidence.evidenceScore * 0.15, 15);
},

  getRiskPenalty(product, integrity) {
    let penalty = 0;

    if (product.status === "WARNING") penalty += 15;
    if (integrity.reviewRequired) penalty += 10;
    if (integrity.conflictFlag) penalty += 25;
    if (integrity.fraudStatus === "MEDIUM") penalty += 15;
    if (integrity.fraudStatus === "HIGH") penalty += 30;
    if (integrity.fraudStatus === "BLOCKED") penalty += 50;

    return penalty;
  },

  getTrustBand(score) {
    if (score >= 90) return "STRONG";
    if (score >= 75) return "GOOD";
    if (score >= 60) return "LIMITED";
    if (score >= 40) return "UNDER REVIEW";
    return "LOW TRUST";
  }
};