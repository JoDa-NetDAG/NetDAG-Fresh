# 📜 NetDAG Deployed Contracts Registry

**Network:** BSC Testnet (Chain ID: 97)  
**Deployment Date:** February 2026  
**Status:** ✅ Active on Testnet

---

## 🔑 Deployer Wallet

**Address:** `0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318`  
**Type:** EOA (Externally Owned Account)  
**Purpose:** Owner/deployer of all NetDAG smart contracts  
**Explorer:** [View on BSCScan](https://testnet.bscscan.com/address/0xF6b3c63722182eD9e7889aDD34A4F97c25e1B318)

> ⚠️ **Security:** This address owns all contracts and has admin privileges. Private key is stored in `.env` file (never commit to git!)

---

## 📜 Deployed Smart Contracts

### 1️⃣ NDG Token Contract

**Address:** `0xf8E886791E26DFD9195C1225b4Ca6458725DAe50`  
**Contract Name:** `NDGToken`  
**Standard:** ERC-20 (BEP-20 on BSC)  
**Explorer:** [View on BSCScan](https://testnet.bscscan.com/address/0xf8E886791E26DFD9195C1225b4Ca6458725DAe50)

**Purpose:**
- Main NetDAG utility token
- Total Supply: 1,000,000,000 NDG (1 Billion)
- 18 decimals
- Mintable by owner
- Used for presale, staking, rewards, and ecosystem

**Key Functions:**
- `transfer()` - Transfer tokens
- `approve()` - Approve spending
- `mint()` - Mint new tokens (owner only)
- `balanceOf()` - Check balance

**Source Code:** `netdag-presale/contracts/NDGToken.sol`

---

### 2️⃣ Presale Contract (PresaleWithVesting)

**Address:** `0x74d469c0eEd89b0F17189c824C95622C680f803E`  
**Contract Name:** `PresaleWithVesting`  
**Explorer:** [View on BSCScan](https://testnet.bscscan.com/address/0x74d469c0eEd89b0F17189c824C95622C680f803E)

**Purpose:**
- Manage presale of NDG tokens
- 9-tier pricing structure
- Accepts BNB, USDT, BUSD
- Integrated with Chainlink price oracle
- Built-in 5% referral system
- Automatic vesting integration

**Key Features:**
- ✅ **Multi-tier pricing:** Progressive price increases
- ✅ **Multi-payment:** BNB and stablecoins accepted
- ✅ **Referral bonuses:** 5% rewards for referrers
- ✅ **Vesting:** Automatic token vesting through VestingVault
- ✅ **Oracle pricing:** Real-time BNB/USD from Chainlink
- ✅ **Contribution limits:** Min $50, Max $50,000 per user

**Key Functions:**
- `buyWithBNB(address referrer)` - Purchase with BNB
- `buyWithStable(address token, uint256 amount, address referrer)` - Purchase with stablecoins
- `tiers(uint256 index)` - Get tier information
- `contributionUsd18(address user)` - Get user's total contribution
- `totalSoldUsd18()` - Get total USD raised

**Source Code:** `netdag-presale/contracts/PresaleWithVesting.sol`

**Presale Allocation:** 600M NDG (60% of total supply)

---

### 3️⃣ Vesting Vault Contract

**Address:** `0x0aC817497d482629879d9c44fF226C033c5f64D4`  
**Contract Name:** `VestingVault`  
**Explorer:** [View on BSCScan](https://testnet.bscscan.com/address/0x0aC817497d482629879d9c44fF226C033c5f64D4)

**Purpose:**
- Manages token vesting schedules
- Locks presale tokens with release schedule
- Prevents immediate dumps
- Protects early investors

**Key Features:**
- ✅ Customizable vesting periods
- ✅ Cliff periods support
- ✅ Linear vesting release
- ✅ Multiple beneficiaries support
- ✅ Non-revocable schedules

**Key Functions:**
- `createVestingSchedule()` - Create new vesting (owner only)
- `release(address beneficiary)` - Release vested tokens
- `getVestingSchedule(address beneficiary)` - Get vesting details
- `getReleasableAmount(address beneficiary)` - Check claimable tokens

**Source Code:** `netdag-presale/contracts/VestingVault.sol`

**Connected to:** Presale contract (receives tokens automatically)

---

### 4️⃣ Staking Contract

**Address:** `0x7730dCD24b93F171A7B7B85FcDB4193E94614D70`  
**Contract Name:** `NDGStaking`  
**Explorer:** [View on BSCScan](https://testnet.bscscan.com/address/0x7730dCD24b93F171A7B7B85FcDB4193E94614D70)

**Purpose:**
- Stake NDG tokens to earn rewards
- Lock tokens for specified periods
- Earn passive income

**Key Features:**
- ✅ Flexible staking periods
- ✅ Rewards based on staking duration
- ✅ Limited rewards pool (60M NDG)
- ✅ Rejects stakes when pool depleted

**Key Functions:**
- `stake(uint256 amount)` - Stake NDG tokens
- `withdraw(uint256 amount)` - Unstake tokens
- `getReward()` - Claim staking rewards
- `balanceOf(address account)` - Check staked balance
- `earned(address account)` - Check pending rewards

**Source Code:** `staking/` folder

**Staking Allocation:** 60M NDG (6% of total supply)

> ⚠️ **Note:** Staking rewards are limited. Contract will reject new stakes when reward pool is empty.

---

## 🔗 Contract Relationships

```
Deployer Wallet (0xF6b3c6...)
    │
    ├─► NDG Token (0xf8E886...)
    │       │
    │       ├─► Used by Presale
    │       ├─► Used by Staking
    │       └─► Locked in Vesting
    │
    ├─► Presale (0x74d469...)
    │       │
    │       ├─► Sells NDG tokens
    │       ├─► Accepts BNB/USDT/BUSD
    │       ├─► Uses Chainlink Oracle for pricing
    │       └─► Sends tokens to Vesting
    │
    ├─► Vesting Vault (0x0aC817...)
    │       │
    │       ├─► Receives from Presale
    │       └─► Releases to buyers over time
    │
    └─► Staking (0x7730dc...)
            │
            ├─► Accepts NDG deposits
            └─► Distributes rewards (60M pool)
```

---

## 📊 Token Distribution Summary

| Allocation | Amount | Percentage | Contract/Address |
|------------|--------|------------|------------------|
| **Presale** | 600M NDG | 60% | `0x74d469c0eEd89b0F17189c824C95622C680f803E` |
| **Permanent Reserve** | 220M NDG | 22% | Bonding curve contract (TBD) |
| **Gas Sponsorship** | 30M NDG | 3% | Gas subsidy contract (TBD) |
| **Staking/Vesting** | 60M NDG | 6% | `0x7730dCD24b93F171A7B7B85FcDB4193E94614D70` |
| **Partnerships** | 50M NDG | 5% | Treasury (managed by CEO) |
| **Ecosystem** | 20M NDG | 2% | Treasury (managed by CEO) |
| **Team** | 20M NDG | 2% | Vested to core team |
| **TOTAL** | 1,000M NDG | 100% | Max supply |

---

## 🌐 Network Configuration

**Network Name:** BNB Smart Chain Testnet  
**Chain ID:** 97 (0x61 in hex)  
**RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545/  
**Block Explorer:** https://testnet.bscscan.com  
**Native Token:** tBNB (Testnet BNB)  

**Faucets for tBNB:**
- https://testnet.bnbchain.org/faucet-smart
- https://testnet.binance.org/faucet-smart

---

## 📁 Contract Source Code Locations

| Contract | Source File | ABI Location |
|----------|-------------|--------------|
| NDG Token | `netdag-presale/contracts/NDGToken.sol` | `netdag-presale/artifacts/contracts/NDGToken.sol/NDGToken.json` |
| Presale | `netdag-presale/contracts/PresaleWithVesting.sol` | `netdag-presale/artifacts/contracts/PresaleWithVesting.sol/PresaleWithVesting.json` |
| Vesting Vault | `netdag-presale/contracts/VestingVault.sol` | `netdag-presale/artifacts/contracts/VestingVault.sol/VestingVault.json` |
| Staking | `staking/` folder | `staking/staking-abi.js` |

---

## 🔐 Security Notes

### Critical Security Measures:

1. **Private Keys:**
   - ✅ Never commit `.env` file to git
   - ✅ Store securely (password manager recommended)
   - ✅ Backup in multiple secure locations

2. **Contract Ownership:**
   - ✅ All contracts owned by deployer wallet
   - ✅ Only owner can: mint tokens, pause presale, withdraw funds
   - ⚠️ Consider multi-sig wallet for mainnet

3. **Testnet vs Mainnet:**
   - ✅ These are TESTNET contracts (no real value)
   - ⚠️ Re-deploy and re-audit before mainnet
   - ⚠️ Use different deployer wallet for mainnet

4. **Contract Verification:**
   - 🔄 Contracts should be verified on BSCScan
   - 🔄 Allows public to view source code
   - 🔄 Increases trust and transparency

---

## 🔄 Deployment History

### Initial Deployment (February 2026)
```
1. NDG Token deployed: 0xf8E886791E26DFD9195C1225b4Ca6458725DAe50
2. Vesting Vault deployed: 0x0aC817497d482629879d9c44fF226C033c5f64D4
3. Presale deployed: 0x74d469c0eEd89b0F17189c824C95622C680f803E
4. Staking deployed: 0x7730dCD24b93F171A7B7B85FcDB4193E94614D70
```

**Deployment Script:** `netdag-presale/scripts/deploy-bsctest.js`

---

## 🛠️ How to Interact with Contracts

### Using Hardhat Console:
```bash
cd netdag-presale
npx hardhat console --network bsctest
```

```javascript
const presale = await ethers.getContractAt("PresaleWithVesting", "0x74d469c0eEd89b0F17189c824C95622C680f803E");
const tier = await presale.tiers(0);
console.log("Tier 0 price:", ethers.formatUnits(tier.priceUsd18, 18));
```

### Using Web3 (Frontend):
```javascript
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from './config/contract-config.js';

const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL);
const presale = new ethers.Contract(
  CONTRACT_CONFIG.PRESALE_CONTRACT,
  PRESALE_ABI,
  provider
);

const totalSold = await presale.totalSoldUsd18();
console.log("Total sold:", ethers.formatUnits(totalSold, 18), "USD");
```

---

## 📞 Support & Resources

- **GitHub Repository:** https://github.com/JoDa-NetDAG/NetDAG-Fresh
- **BSC Testnet Explorer:** https://testnet.bscscan.com
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts
- **Hardhat Documentation:** https://hardhat.org/docs

---

## ⚠️ Important Reminders

1. **These are TESTNET contracts** - No real financial value
2. **Private keys must be secured** - Never share or commit to git
3. **Contracts are immutable** - Cannot be changed after deployment
4. **Always test thoroughly** before mainnet deployment
5. **Get professional audit** before launching on mainnet
6. **Backup all contract addresses** - This document is critical!

---

**Last Updated:** February 17, 2026  
**Maintained by:** NetDAG Team  
**Document Version:** 1.0.0
