# 🚀 NetDAG Presale V2 - Deployment Notes

**Last Updated:** 2026-02-18  
**Version:** 2.0 (Treasury Redistribution System)

---

## 📊 Key Changes from V1

| Feature | V1 (Old) | V2 (New) |
|---------|----------|----------|
| Unsold Tokens | 100% Burned | Sent to Treasury |
| Function Name | `finalizePresaleAndBurn()` | `finalizePresale()` |
| Treasury Address | N/A | Required setup |
| Redistribution | Automatic burn | Manual (CEO controlled) |

---

## 📍 Contract Addresses

### **OLD DEPLOYMENT (DEPRECATED - DO NOT USE)**
```
NDGToken:       0xf8E886791E26DFD9195C1225b4Ca6458725DAe50
Presale:        0x74d469c0eEd89b0F17189c824C95622C680f803E
VestingVault:   0x0aC817497d482629879d9c44fF226C033c5f64D4
Staking:        0x7730dCD24b93F171A7B7B85FcDB4193E94614D70
```

### **NEW DEPLOYMENT (V2 - ACTIVE)**
```
NDGToken:       [PENDING DEPLOYMENT]
VestingVault:   [PENDING DEPLOYMENT]
Presale:        [PENDING DEPLOYMENT]
Staking:        [PENDING DEPLOYMENT]

Treasury:       0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318 ✅
Testing Wallet: 0x8834aa98987c170c0f36e087a7ffa08070c1ad4b
```

**Network:** BSC Testnet (Chain ID: 97)  
**Deployer:** 0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318

---

## 🎯 Token Distribution (Updated)

### **Total Supply: 1,000,000,000 NDG**

| Allocation | % | Amount | Status |
|------------|---|--------|--------|
| **Presale & Referral** | 60% | 600M NDG | 9-tier presale |
| **Bonding Curve Reserve** | 22% | 220M NDG | 🛡️ **PERMANENT LOCK** |
| **Staking Rewards** | 6% | 60M NDG | Long-term holders |
| **Partnerships** | 5% | 50M NDG | Milestone-based |
| **Gas-Free Pool** | 3% | 30M NDG | Zero-gas transactions |
| **Ecosystem** | 2% | 20M NDG | dVPN, Provenance, Guardian |
| **Team** | 2% | 20M NDG | 2-year lock |

---

## 💰 9-Tier Presale Structure

| Tier | Price | Allocation | Duration | vs Listing ($0.75) |
|------|-------|------------|----------|---------------------|
| 1 | $0.006 | 108M NDG | 30 days | 125x 🚀 |
| 2 | $0.012 | 84M NDG | 30 days | 62.5x 🚀 |
| 3 | $0.018 | 72M NDG | 30 days | 41.7x 🔥 |
| 4 | $0.024 | 66M NDG | 30 days | 31.3x 🔥 |
| 5 | $0.030 | 60M NDG | 30 days | 25x 💎 |
| 6 | $0.054 | 54M NDG | 30 days | 13.9x 💎 |
| 7 | $0.084 | 48M NDG | 30 days | 8.9x ⚡ |
| 8 | $0.120 | 36M NDG | 30 days | 6.3x ⚡ |
| 9 | $0.160 | 30M NDG | 30 days | 4.7x ✨ |

**Total Presale:** 600M NDG over 270 days (9 months)  
**Listing Price:** $0.75 per NDG

---

## 🏦 Treasury Redistribution Plan

After presale ends, **ALL UNSOLD TOKENS** go to Treasury:

```
Treasury Receives 100% of Unsold Tokens
↓
CEO/Team Manually Redistributes:

20% → Bonding Curve Reserve (adds to 22% permanent lock)
10% → Staking Rewards Pool
10% → Gas-Free Transaction Pool
10% → Treasury Operations
50% → Strategic Reserve (Resale or Burn)
```

### **Timeline:**
- **Months 1-9:** Active presale
- **Month 10:** Optional CEO extension (max 12 months total)
- **Months 10-12:** 50% strategic reserve can be resold (max 3 months)
- **After 12 months:** ALL remaining unsold tokens MUST be burned

---

## 🔧 Deployment Steps

### **STEP 1: Deploy Contracts**

```bash
# 1. Deploy NDGToken
npx hardhat run scripts/deploy-token.js --network bscTestnet

# 2. Deploy VestingVault
npx hardhat run scripts/deploy-vesting.js --network bscTestnet

# 3. Deploy Presale
npx hardhat run scripts/deploy-presale.js --network bscTestnet

# 4. Deploy Staking (optional - can be done later)
npx hardhat run scripts/deploy-staking.js --network bscTestnet
```

### **STEP 2: Initial Configuration**

```javascript
// 1. Set Treasury Address in VestingVault
await vestingVault.setTreasuryAddress("0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318");

// 2. Transfer 600M NDG to VestingVault
await ndgToken.transfer(vestingVault.address, ethers.utils.parseEther("600000000"));

// 3. Set Presale Contract in VestingVault
await vestingVault.setPresaleContract(presale.address);

// 4. Verify balances
console.log("VestingVault balance:", await ndgToken.balanceOf(vestingVault.address));
```

### **STEP 3: Start Presale**

```javascript
// When ready to launch
await presale.startPresale();
// Sets presaleEndTime = now + 270 days
// Initializes Tier 1 (30-day timer starts)
```

### **STEP 4: After Presale (9-12 months later)**

```javascript
// 1. Finalize presale
await presale.finalizePresale();
// Sends unsold tokens to Treasury

// 2. Check Treasury balance
const unsoldTokens = await ndgToken.balanceOf("0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318");
console.log("Treasury received:", ethers.utils.formatEther(unsoldTokens), "NDG");

// 3. CEO manually redistributes from Treasury:
// - 20% to Bonding Curve
// - 10% to Staking
// - 10% to Gas-Free
// - 10% keep in Treasury
// - 50% to Resale wallet or burn
```

---

## ⚠️ CRITICAL: What Changed?

### **Functions Renamed:**
- ❌ **OLD:** `finalizePresaleAndBurn()`
- ✅ **NEW:** `finalizePresale()`

### **New Required Setup:**
```javascript
// MUST call before finalization:
await vestingVault.setTreasuryAddress(TREASURY_ADDRESS);
```

### **New Events:**
- `TreasuryAddressSet(address indexed treasury)`
- `WithdrawnToTreasury(address indexed treasury, uint256 amount, uint256 timestamp)`
- `UnsoldToTreasury(uint256 amount, uint256 timestamp)`

---

## 🧪 Testing Checklist

```bash
# Run all tests
npx hardhat test

# Specific test files
npx hardhat test test/VestingVault.test.js
npx hardhat test test/PresaleWithVesting.test.js
npx hardhat test test/PresaleNineTier.test.js

# Coverage
npx hardhat coverage
```

**Expected Test Updates:**
- Replace `finalizePresaleAndBurn` calls with `finalizePresale`
- Add `setTreasuryAddress` calls before finalization tests
- Verify tokens go to Treasury, not burned

---

## 📝 Vesting Schedule

| Milestone | Unlock % | Time After TGE |
|-----------|----------|----------------|
| TGE | 40% | Immediate |
| +3 Months | 20% | 3 months |
| +6 Months | 20% | 6 months |
| +9 Months | 20% | 9 months |

**Example:**
- Purchase: $1,000 in Tier 1 → 166,667 NDG
- At TGE: 66,667 NDG (40%)
- +3 months: 33,333 NDG
- +6 months: 33,333 NDG
- +9 months: 33,334 NDG

---

## 💎 Staking (Coming Soon)

| Duration | APR |
|----------|-----|
| 30 days | 6% |
| 6 months | 10% |
| 12 months | 15% |
| 2 years | 22% |
| 3 years | 30% |

---

## 🛡️ Security Notes

### **Access Control:**
- ✅ Only owner can call `finalizePresale()`
- ✅ Only owner can set treasury address
- ✅ Only presale contract can call `withdrawToTreasury()`
- ✅ Treasury address cannot be zero address

### **Validation:**
- ✅ Cannot finalize before presale ends
- ✅ Cannot finalize twice
- ✅ Cannot withdraw to treasury without setting address first
- ✅ Amount must be > 0

### **Transparency:**
- ✅ All treasury transfers emit events
- ✅ All on-chain actions verifiable on BSCScan
- ✅ Manual redistribution publicly announced

---

## 📞 Support & Updates

- **Repository:** https://github.com/JoDa-NetDAG/netdag-presale
- **Frontend:** https://github.com/JoDa-NetDAG/NetDAG-Fresh
- **Documentation:** See `UPGRADE_SUMMARY.md` for full details
- **Issues:** Create GitHub issue for bugs/questions

---

## 🎯 Quick Reference Card

**Save this for deployment day:**

```javascript
// 1. DEPLOY
const token = await NDGToken.deploy();
const vault = await VestingVault.deploy(token.address);
const presale = await PresaleWithVesting.deploy(token.address, vault.address, priceFeed);

// 2. SETUP
await vault.setTreasuryAddress("0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318");
await token.transfer(vault.address, "600000000000000000000000000"); // 600M
await vault.setPresaleContract(presale.address);

// 3. START
await presale.startPresale();

// 4. FINALIZE (after 9 months)
await presale.finalizePresale();

// 5. VERIFY
const treasuryBalance = await token.balanceOf("0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318");
console.log("Treasury:", ethers.utils.formatEther(treasuryBalance));
```

---

**END OF DEPLOYMENT NOTES**
