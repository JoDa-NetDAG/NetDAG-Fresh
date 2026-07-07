const GuardianBrain = {
  analyze(product) {
    if (!product) return null;

    const state = this.getProductState(product);
    const reasons = this.getReasons(product, state);
    const warnings = this.getWarnings(product, state);

    return {
      state,
      decision: this.getDecision(state),
      recommendation: this.getRecommendation(state),
      confidence: product.trustScore,
      reasons,
      warnings,
      nextAction: this.getNextAction(state)
    };
  },

  getProductState(product) {
    return {
      verification: this.getVerificationState(product),
      certificate: this.getCertificateState(product),
      evidence: product.evidenceStrength || "LOW",
      integrity: product.conflictFlag ? "CONFLICT" : "PASS",
      risk: product.fraudStatus || "LOW",
      reviewRequired: product.reviewRequired === true
    };
  },

  getVerificationState(product) {
    if (product.status === "FAILED") return "FAILED";
    if (product.status === "WARNING") return "LIMITED";
    if (product.status === "VERIFIED") return "VERIFIED";
    return "UNKNOWN";
  },

  getCertificateState(product) {
    if (product.certificateRevoked) return "REVOKED";
    if (product.certificateAvailable === false) return "MISSING";
    if (product.certificateStatus === "VALID") return "VALID";
    if (product.certificateStatus === "UNDER REVIEW") return "UNDER REVIEW";
    if (product.certificateStatus === "LIMITED") return "LIMITED";
    return "PENDING";
  },

  getDecision(state) {
    if (state.certificate === "REVOKED") return "CERTIFICATE REVOKED";
    if (state.integrity === "CONFLICT") return "REVIEW REQUIRED";
    if (state.reviewRequired) return "UNDER REVIEW";
    if (state.verification === "FAILED") return "AUTHENTICITY NOT CONFIRMED";
    if (state.verification === "VERIFIED" && state.certificate === "VALID" && state.evidence === "STRONG") {
      return "AUTHENTIC";
    }
    if (state.evidence === "GOOD") return "LIKELY AUTHENTIC";
    if (state.evidence === "LIMITED") return "LIMITED CONFIDENCE";

    return "INSUFFICIENT INFORMATION";
  },

  getRecommendation(state) {
    if (state.certificate === "REVOKED") {
      return "Certificate validity could not be confirmed.";
    }

    if (state.certificate === "MISSING") {
      return "Certificate could not be confirmed.";
    }

    if (state.integrity === "CONFLICT") {
      return "Conflicting information was detected.";
    }

    if (state.reviewRequired) {
      return "Additional verification is recommended.";
    }

    if (state.verification === "FAILED") {
      return "Product authenticity could not be confirmed.";
    }

    if (state.verification === "VERIFIED" && state.certificate === "VALID") {
      return "Product verification completed successfully.";
    }

    return "Additional verification is recommended.";
  },

  getNextAction(state) {
    if (
      state.certificate === "REVOKED" ||
      state.certificate === "MISSING" ||
      state.integrity === "CONFLICT" ||
      state.reviewRequired ||
      state.verification === "FAILED"
    ) {
      return "Verify with the manufacturer or certificate issuer.";
    }

    if (state.verification === "VERIFIED" && state.certificate === "VALID") {
      return "Verification complete.";
    }

    return "Verify with the manufacturer or certificate issuer.";
  },

  getReasons(product, state) {
    const reasons = [];

    if (state.evidence === "STRONG") {
      reasons.push("Strong evidence supports this product record.");
    }

    if (state.evidence === "GOOD") {
      reasons.push("Good evidence supports this product record.");
    }

    if (product.hasManufacturerEvidence) {
      reasons.push("Manufacturer evidence is available.");
    }

    if (product.hasBarcodeEvidence) {
      reasons.push("Barcode evidence is available.");
    }

    if (product.hasCertificateEvidence) {
      reasons.push("Digital certificate evidence is available.");
    }

    if (state.integrity === "PASS") {
      reasons.push("No conflicting product information detected.");
    }

    if (state.certificate === "VALID") {
      reasons.push("Digital certificate is currently valid.");
    }

    if (!reasons.length) {
      reasons.push("Limited product evidence is currently available.");
    }

    return reasons;
  },

  getWarnings(product, state) {
    const warnings = [];

    if (state.certificate === "REVOKED") {
      warnings.push("Certificate has been revoked.");
    }

    if (state.certificate === "MISSING") {
      warnings.push("Certificate could not be confirmed.");
    }

    if (state.integrity === "CONFLICT") {
      warnings.push("Conflicting information detected.");
    }

    if (state.reviewRequired) {
      warnings.push("Product record requires additional review.");
    }

    if (state.risk === "MEDIUM") {
      warnings.push("Moderate risk signal detected.");
    }

    if (state.risk === "HIGH" || state.risk === "BLOCKED") {
      warnings.push("High risk signal detected.");
    }

    return warnings;
  }
};