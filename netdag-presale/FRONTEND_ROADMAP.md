# NetDAG Presale - Frontend Roadmap

**Last Updated:** 2026-02-15  
**Current Phase:** Smart Contracts Deployed ✅  
**Next Phase:** Frontend Development 🚧

---

## 🎯 Frontend Development Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up React/Next.js project
- [ ] Install web3 dependencies (ethers.js, wagmi, RainbowKit)
- [ ] Configure BSC Testnet connection
- [ ] Create wallet connection component
- [ ] Set up environment variables for contract addresses

### Phase 2: Presale Interface (Week 3-4)
- [ ] Create presale dashboard UI
- [ ] Display current tier and pricing
- [ ] Show total raised and tokens sold
- [ ] Implement BNB contribution form
- [ ] Implement stablecoin contribution form
- [ ] Add vesting option selection (Option 1 vs Option 2)
- [ ] Display real-time token allocation calculation

### Phase 3: User Dashboard (Week 5-6)
- [ ] Create user allocation viewer
- [ ] Show vested vs claimable tokens
- [ ] Display vesting schedule timeline
- [ ] Implement claim buttons (immediate + vested)
- [ ] Show transaction history
- [ ] Add countdown timer to TGE

### Phase 4: Admin Panel (Week 7)
- [ ] Create admin dashboard (owner only)
- [ ] Tier management interface
- [ ] TGE trigger button
- [ ] Withdraw funds interface
- [ ] View total contributions and statistics

### Phase 5: Polish & Testing (Week 8)
- [ ] Add loading states and animations
- [ ] Implement error handling and user feedback
- [ ] Add responsive design for mobile
- [ ] Test all user flows
- [ ] Security audit of frontend code

---

## 🔌 Contract Integration Requirements

### Contract Addresses (BSC Testnet)
\\\javascript
const CONTRACTS = {
  NDGToken: '0xA1f0eFEceA319da623f553b6ECD7411167394dE5',
  VestingVault: '0xdC68eb05Cb64b036Bb9dEfF762C4bbb1c1cb5F72',
  PresaleWithVesting: '0x75893CC311530874C52Ec563ed5513FF345311EA',
};
\\\

### Required ABIs
1. **PresaleWithVesting.sol** - For presale contributions
2. **VestingVault.sol** - For vesting management and claims
3. **NDGToken.sol** - For token balance checks
4. **ERC20.sol** - For stablecoin approvals

---

## 📊 Key Functions to Integrate

### PresaleWithVesting Contract

#### Read Functions:
\\\javascript
// Get current tier
await presale.currentTier() // Returns: 1, 2, 3, or 4

// Get tier details
await presale.getTierDetails(tierNumber) // Returns: price, maxAllocation, sold

// Get user's total contribution
await presale.contributions(userAddress) // Returns: uint256

// Check if user is whitelisted
await presale.whitelist(userAddress) // Returns: bool

// Get contribution limits
await presale.minContribution() // Returns: uint256
await presale.maxContribution() // Returns: uint256
\\\

#### Write Functions:
\\\javascript
// Contribute with BNB
await presale.contribute(
  0, // tier (0-3 for tiers 1-4)
  0, // cliffMonths (1 or 3)
  ethers.constants.AddressZero, // payment token (0x0 for BNB)
  { value: ethers.utils.parseEther('0.1') } // Amount in BNB
)

// Contribute with stablecoin (USDT/BUSD)
// First approve stablecoin
await stablecoin.approve(presaleAddress, amount)
// Then contribute
await presale.contribute(
  0, // tier
  1, // cliffMonths
  stablecoinAddress, // payment token address
  { value: 0 }
)
\\\

### VestingVault Contract

#### Read Functions:
\\\javascript
// Get user allocation details
await vault.allocations(userAddress)
// Returns: {
//   totalTokens,
//   immediateTokens,
//   vestingTokens,
//   claimedImmediate,
//   claimedVested,
//   cliffMonths,
//   lastClaimTime
// }

// Check if TGE is enabled
await vault.tgeEnabled() // Returns: bool

// Get TGE time
await vault.tgeTime() // Returns: timestamp

// Get unlock times
await vault.unlockTime3Months() // Returns: timestamp
await vault.unlockTime6Months() // Returns: timestamp
await vault.unlockTime9Months() // Returns: timestamp

// Calculate claimable vested tokens
await vault.calculateClaimableVested(userAddress) // Returns: uint256
\\\

#### Write Functions:
\\\javascript
// Claim immediate tokens (at TGE)
await vault.claimImmediate()

// Claim vested tokens (after unlock periods)
await vault.claimVested()
\\\

---

## 🎨 UI Components Needed

### 1. WalletConnect Component
- Connect/Disconnect button
- Display connected address
- Show BNB and NDG balance
- Network switcher (BSC Testnet/Mainnet)

### 2. Presale Card
- Current tier display with progress bar
- Token price calculator
- Payment method selector (BNB/USDT/BUSD)
- Vesting option selector
- Contribution amount input
- "Buy NDG" button
- Transaction status feedback

### 3. Tier Progress Display
\\\
Tier 1: █████████░ 90% (45M/50M NDG sold)
Tier 2: ░░░░░░░░░░ 0% (0/75M NDG sold)
Tier 3: ░░░░░░░░░░ 0% (0/100M NDG sold)
Tier 4: ░░░░░░░░░░ 0% (0/75M NDG sold)
\\\

### 4. Vesting Schedule Visualizer
- Timeline showing TGE, 3mo, 6mo, 9mo unlock dates
- Visual representation of token release percentages
- Highlight current period
- Show claimable amounts

### 5. User Dashboard
- Total purchased tokens
- Immediate tokens (claimed/unclaimed)
- Vested tokens (locked/unlocked/claimed)
- Next unlock date countdown
- Claim buttons with status

---

## 🔔 Events to Listen For

### PresaleWithVesting Events:
\\\javascript
event Contribution(
    address indexed user,
    uint256 amount,
    uint256 tokens,
    uint256 tier,
    uint256 timestamp
);

event TierAdvanced(uint256 newTier, uint256 timestamp);

event TGETriggered(uint256 tgeTime);
\\\

### VestingVault Events:
\\\javascript
event AllocationRecorded(
    address indexed user,
    uint256 totalTokens,
    uint256 immediateTokens,
    uint256 vestingTokens,
    uint8 cliffMonths
);

event ImmediateTokensClaimed(address indexed user, uint256 amount);

event VestingTokensClaimed(address indexed user, uint256 amount);

event TGEEnabled(uint256 tgeTime);
\\\

---

## 🛠️ Recommended Tech Stack

### Frontend Framework:
- **Next.js 14** - React framework with SSR
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Web3 Libraries:
- **ethers.js v6** - Ethereum interactions
- **wagmi** - React hooks for Ethereum
- **RainbowKit** - Wallet connection UI
- **viem** - Low-level Ethereum utilities

### State Management:
- **Zustand** or **React Context** - Global state
- **React Query** - Server state & caching

### UI Components:
- **shadcn/ui** - Component library
- **Recharts** - Charts for analytics
- **Framer Motion** - Animations

---

## 📱 Page Structure

\\\
/
├── / (Home/Presale)
│   ├── Hero section
│   ├── Presale card
│   ├── Tier progress
│   └── Stats (raised, sold, participants)
│
├── /dashboard
│   ├── User allocations
│   ├── Vesting schedule
│   ├── Claim interface
│   └── Transaction history
│
├── /admin (Owner only)
│   ├── Tier management
│   ├── TGE trigger
│   ├── Withdraw funds
│   └── Analytics
│
└── /docs
    ├── How to buy
    ├── Vesting info
    └── FAQ
\\\

---

## 🔐 Security Considerations

1. **Input Validation** - Validate all user inputs before sending to contract
2. **Transaction Simulation** - Show estimated gas and outcome before confirming
3. **Error Handling** - Clear error messages for failed transactions
4. **Slippage Protection** - Warn users about tier changes during purchase
5. **HTTPS Only** - Enforce secure connections
6. **Contract Address Verification** - Display contract addresses for user verification

---

## 📈 Analytics & Tracking

### Metrics to Display:
- Total raised (USD equivalent)
- Total NDG sold
- Number of participants
- Current tier and price
- Time until tier advance
- Days until TGE

### Optional Integrations:
- Google Analytics - User behavior
- Mixpanel - Conversion tracking
- Etherscan API - Transaction history

---

## 🚀 Deployment Checklist

- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain
- [ ] Set up environment variables
- [ ] Enable HTTPS
- [ ] Test on mobile devices
- [ ] Test all wallet providers
- [ ] Monitor error logs
- [ ] Set up analytics

---

## 📞 Frontend Developer Resources

- **Contract ABIs:** \rtifacts/contracts/\ folder
- **Deployment Info:** \DEPLOYMENT.md\
- **API Reference:** \API_REFERENCE.md\ (coming soon)
- **Hardhat Network:** For local testing

### Quick Start Commands:
\\\ash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Run setup script
npx hardhat run scripts/setup.js --network localhost
\\\

---

**Questions?** Contact: JoDa-NetDAG
