const LearningQueue = {
  STORAGE_KEY: "netdag_learning_queue",
  APP_VERSION: "1.0",

  getAll() {
    try {
      const queue = localStorage.getItem(this.STORAGE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  },

  add(scan) {
    if (!scan || !scan.code) return null;

    const queue = this.getAll();
    const cleanCode = String(scan.code || "").trim();

    if (!cleanCode) return null;

    const existing = queue.find((item) => item.code === cleanCode);

    if (existing) {
      existing.scanCount = (existing.scanCount || 1) + 1;
      existing.lastSeen = new Date().toISOString();
      this.write(queue);
      return existing;
    }

    const record = {
      id: `LQ-${Date.now()}`,
      code: cleanCode,
      type: scan.type || "UNKNOWN",

      status: "AWAITING_GUARDIAN_EVALUATION",
      guardianStage: "SUBMITTED",
      provisionalDecision: "PENDING",
      score: null,

      productName: "Unknown",
      brand: "Unknown",
      category: "Unknown",

      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      scanCount: 1,

      aiReviewed: false,
      manuallyReviewed: false,

      source: "USER_SCAN",
      appVersion: this.APP_VERSION
    };

    queue.unshift(record);
    this.write(queue);

    return record;
  },

  evaluate(code) {
    const cleanCode = String(code || "").trim();
    if (!cleanCode) return null;

    const queue = this.getAll();
    const item = queue.find((entry) => entry.code === cleanCode);

    if (!item) return null;

    let score = 50;
    let guardianStage = "SUBMITTED";
    let provisionalDecision = "PENDING";
    let status = "AWAITING_GUARDIAN_EVALUATION";

    if (item.type === "BARCODE") {
      score += 10;
      guardianStage = "AUTO_VALIDATED";
      provisionalDecision = "PRODUCT_IDENTIFIER_CAPTURED";
      status = "EVIDENCE_GROWING";
    }

    if (item.type === "QR_URL" || item.type === "QR_TEXT") {
      score += 15;
      guardianStage = "AUTO_VALIDATED";
      provisionalDecision = "DIGITAL_IDENTIFIER_CAPTURED";
      status = "EVIDENCE_GROWING";
    }

    if (score >= 75) {
      provisionalDecision = "AUTO_VALIDATED";
      status = "READY_FOR_GUARDIAN_REVIEW";
    }

    item.score = Math.min(100, score);
    item.guardianStage = guardianStage;
    item.provisionalDecision = provisionalDecision;
    item.status = status;
    item.lastEvaluatedAt = new Date().toISOString();

    this.write(queue);
    return item;
  },

  updateEvaluation(code, evaluation) {
    const queue = this.getAll();
    const cleanCode = String(code || "").trim();

    const item = queue.find((entry) => entry.code === cleanCode);

    if (!item) return null;

    item.status = evaluation.status || item.status;
    item.guardianStage = evaluation.guardianStage || item.guardianStage;
    item.provisionalDecision =
      evaluation.provisionalDecision || item.provisionalDecision;
    item.score = typeof evaluation.score === "number" ? evaluation.score : item.score;
    item.category = evaluation.category || item.category;
    item.productName = evaluation.productName || item.productName;
    item.brand = evaluation.brand || item.brand;
    item.lastEvaluatedAt = new Date().toISOString();

    this.write(queue);
    return item;
  },

  write(queue) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};