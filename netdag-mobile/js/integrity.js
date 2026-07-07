const Integrity = {
  evaluate(product) {
    if (!product) return null;

    return {
      conflictFlag: this.hasConflict(product),
      reviewRequired: this.requiresReview(product),
      fraudStatus: this.getFraudStatus(product),
      trustStage: this.getTrustStage(product),
      publicMessage: this.getPublicMessage(product)
    };
  },

  hasConflict(product) {
    return product.conflictFlag === true;
  },

  requiresReview(product) {
    return product.reviewRequired === true || product.trustStatus === "SUBMITTED";
  },

  getFraudStatus(product) {
    return product.fraudStatus || "LOW";
  },

  getTrustStage(product) {
    return product.trustStatus || "SUBMITTED";
  },

  getPublicMessage(product) {
    if (this.hasConflict(product)) {
      return "Conflicting information detected.";
    }

    if (this.requiresReview(product)) {
      return "Product record under review.";
    }

    if (product.trustStatus === "AUTO_VALIDATED") {
      return "Product passed automatic checks. Further evidence recommended.";
    }

    if (product.trustStatus === "EVIDENCE_CONFIRMED") {
      return "Product information is supported by consistent evidence.";
    }

    if (product.trustStatus === "TRUSTED_PRODUCT") {
      return "Trusted product record.";
    }

    if (product.trustStatus === "NETDAG_VERIFIED") {
      return "NetDAG verified product.";
    }

    return "Information currently limited.";
  }
};