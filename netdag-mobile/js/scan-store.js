const ScanStore = {
  STORAGE_KEY: "netdag_scan_history",
  APP_VERSION: "1.0",

  getAll() {
    try {
      const scans = localStorage.getItem(this.STORAGE_KEY);
      return scans ? JSON.parse(scans) : [];
    } catch {
      return [];
    }
  },

  save(scan) {
    const scans = this.getAll();
    const cleanCode = String(scan.code || "").trim();

    if (!cleanCode) return null;

    const existing = scans.find((item) => item.code === cleanCode);

    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastScannedAt = new Date().toISOString();
      existing.status = scan.status || existing.status;
      existing.result = scan.result || existing.result;
      this.write(scans);
      return existing;
    }

    const newScan = {
      id: `SCAN-${Date.now()}`,
      code: cleanCode,
      type: scan.type || "UNKNOWN",
      status: scan.status || "SUBMITTED",
      result: scan.result || "NO_MATCHING_NETDAG_RECORD",
      label: scan.label || "Unknown Product",
      firstScannedAt: scan.scannedAt || new Date().toISOString(),
      lastScannedAt: scan.scannedAt || new Date().toISOString(),
      count: 1,
      appVersion: this.APP_VERSION
    };

    scans.unshift(newScan);
    this.write(scans);

    return newScan;
  },

  saveKnown(product, scannedCode) {
    if (!product) return null;

    return this.save({
      code: scannedCode || product.productId || product.onchainId,
      type: "NETDAG_RECORD",
      status: product.status || "VERIFIED",
      result: "MATCHING_NETDAG_RECORD",
      label: product.name || "Verified Product",
      scannedAt: new Date().toISOString()
    });
  },

  write(scans) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scans));
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};