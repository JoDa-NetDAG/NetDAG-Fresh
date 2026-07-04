const Guardian = {
  products: {
    "NDG-FASHION-000001": {
      recordId: "NDG-REC-2026-000001",
      name: "Nike Air Max 270",
      brand: "Nike",
      sku: "NDG-FASHION-000001",
      batch: "LOT-2026-0001",
      category: "Fashion",
      country: "Vietnam",
      origin: "Vietnam",
      manufacturer: "Nike Inc.",
      issuer: "NetDAG Provenance Desk",
      created: "2026-07-04",
      integrity: "Verified",
      onchainId: "NDG-FASHION-000001",
      guardianScore: 98,
      status: "VERIFIED",
      risk: "No Risk Detected"
    },

    "NDG-MED-000001": {
      recordId: "NDG-REC-2026-000002",
      name: "SafeCure Paracetamol 500mg",
      brand: "SafeCure",
      sku: "NDG-MED-000001",
      batch: "MED-LOT-2026-441",
      category: "Medicine",
      country: "Germany",
      origin: "Germany",
      manufacturer: "SafeCure Pharma GmbH",
      issuer: "NetDAG Medicine Desk",
      created: "2026-07-04",
      integrity: "Verified",
      onchainId: "NDG-MED-000001",
      guardianScore: 91,
      status: "VERIFIED",
      risk: "No Recall Detected"
    },

    "NDG-FOOD-000001": {
      recordId: "NDG-REC-2026-000003",
      name: "Organic Cocoa Drink",
      brand: "PureFarm",
      sku: "NDG-FOOD-000001",
      batch: "FOOD-LOT-2026-118",
      category: "Food",
      country: "Ghana",
      origin: "Ghana",
      manufacturer: "PureFarm Foods Ltd.",
      issuer: "NetDAG Food Desk",
      created: "2026-07-04",
      integrity: "Verified",
      onchainId: "NDG-FOOD-000001",
      guardianScore: 84,
      status: "WARNING",
      risk: "Moderate Sugar Level"
    }
  },

  verify(scannedCode) {
    const code = scannedCode || "NDG-FASHION-000001";
    const product = this.products[code] || this.products["NDG-FASHION-000001"];

    return {
      ...product,
      scannedCode: code
    };
  },

  getCategoryAnalysis(product) {
    const category = product.category?.toLowerCase();

    const modules = {
      fashion: [
        ["Brand Match", "Confirmed"],
        ["Factory Origin", product.origin],
        ["Material Risk", "Low"],
        ["Authenticity Signal", "Strong"]
      ],

      medicine: [
        ["Batch Check", "Valid"],
        ["Expiry Status", "Safe"],
        ["Recall Check", "No Recall Found"],
        ["Active Ingredient", "Verified"]
      ],

      food: [
        ["Nutrition Profile", "Available"],
        ["Allergen Check", "No Alert"],
        ["Sugar / Salt Risk", "Moderate"],
        ["Safety Signal", "Acceptable"]
      ],

      electronics: [
        ["Serial Number", "Verified"],
        ["Warranty", "Detected"],
        ["Certification", "Matched"],
        ["Tamper Risk", "Low"]
      ]
    };

    return modules[category] || [
      ["Guardian Module", "Ready"],
      ["Category", product.category || "Unknown"],
      ["Risk Signal", product.risk || "Pending"]
    ];
  }
};