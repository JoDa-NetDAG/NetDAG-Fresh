const Certificate = {
  generate(product) {
    if (!product) return null;

    const issuedAt = new Date().toISOString();
    const certificateId = this.createCertificateId(product);
    const fingerprint = this.createFingerprint(product, issuedAt);

    return {
      certificateId,
      status: this.getCertificateStatus(product),
      issuedAt,
      version: "1.0",
      network: "NetDAG Provenance Network",
      fingerprint,
      verifyUrl: `https://netdag.com/certificate/${certificateId}`,
      productId: product.productId,
      onchainId: product.onchainId,
      recordId: product.recordId
    };
  },

  createCertificateId(product) {
    const base = product.onchainId || product.productId || "NDG-CERT";
    return `CERT-${base}`;
  },

  createFingerprint(product, issuedAt) {
    const raw = [
      product.productId,
      product.onchainId,
      product.recordId,
      product.name,
      product.brand,
      product.manufacturer,
      product.trustScore,
      product.trustBand,
      issuedAt
    ].join("|");

    let hash = 0;

    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }

    return `NDG-${Math.abs(hash).toString(16).toUpperCase()}`;
  },

  getCertificateStatus(product) {
    if (product.certificateRevoked) return "REVOKED";
    if (product.certificateAvailable === false) return "MISSING";
    if (product.conflictFlag) return "UNDER REVIEW";
    if (product.reviewRequired) return "UNDER REVIEW";
    if (product.status === "VERIFIED") return "VALID";
    if (product.status === "WARNING") return "LIMITED";

    return "PENDING";
  }
};