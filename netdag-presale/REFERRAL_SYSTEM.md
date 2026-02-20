# NetDAG Presale - Referral System v2.0

## 📋 Overview

The NetDAG presale includes a built-in referral system that rewards users for bringing new participants to the presale. Referrers earn **5% bonus tokens** for each purchase made by users they refer.

## 🎯 How It Works

### For Referrers

1. **Share Your Address**: Simply share your wallet address with potential buyers
2. **Earn Bonuses**: When someone uses your address as a referrer, you earn 5% of their token allocation
3. **Immediate Rewards**: Bonus tokens are allocated immediately (no vesting)
4. **Track Performance**: View your referrals and total bonuses on-chain

### For Buyers

1. **Optional System**: Using a referrer is completely optional
2. **No Cost**: Referral bonuses don't reduce your token allocation
3. **Pass Address(0)**: If you don't have a referrer, simply pass `address(0)`
4. **One-Time Link**: Your first purchase establishes the referral relationship permanently

## 💰 Bonus Calculation

### The Math

```
Referral Bonus = Buyer's Tokens × 5%
Bonus Rate = 500 basis points (500 / 10000 = 0.05)
```

### Examples

#### Example 1: Discount Tier (Tier 1 at $0.006)
- Buyer invests: $600 USD
- Buyer receives: 100,000 NDG (immediate)
- **Referrer receives: 5,000 NDG** (5% of 100,000)

#### Example 2: Premium Tier (Tier 5 at $0.021)
- Buyer invests: $600 USD
- Buyer receives: 28,571 NDG (immediate) + 31,429 NDG (vesting)
- Total anchor value: 60,000 NDG
- **Referrer receives: 3,000 NDG** (5% of 60,000 anchor value)

### Critical Detail: Bonus Base Calculation

The referral bonus uses different base values depending on the tier:

- **Discount Tiers** (price < $0.01): Bonus based on immediate tokens (what buyer actually gets)
- **Premium Tiers** (price > $0.01): Bonus based on total tokens (anchor value)

This is implemented in the contract at line ~408:
```solidity
uint256 bonusBase = immediateTokens > totalTokens ? immediateTokens : totalTokens;
_processReferral(buyer, referrer, bonusBase, usdAmount);
```

## 🔧 Technical Integration

### Smart Contract Functions

#### Making a Purchase with Referral

```solidity
// Buy with BNB
function buyWithBNB(address referrer) external payable;

// Buy with Stablecoin
function buyWithStablecoin(
    address stablecoin,
    uint256 amount,
    address referrer
) external;
```

#### Query Referral Information

```solidity
// Get referral info for any address
function getReferralInfo(address user) 
    external 
    view 
    returns (
        address referrer,      // Who referred this user
        uint256 totalBonus,    // Total bonus tokens earned
        uint256 referralCount  // Number of users referred
    );

// Get list of all referrals
function getReferrals(address referrer) 
    external 
    view 
    returns (address[] memory);

// Get total bonus tokens
function getReferralBonus(address referrer) 
    external 
    view 
    returns (uint256);
```

#### Admin Functions

```solidity
// Update referral bonus percentage (owner only)
function setReferralBonusPercent(uint256 newPercent) external onlyOwner;
```

### Web3.js Integration

```javascript
const { ethers } = require("ethers");

// Connect to contract
const presale = new ethers.Contract(
    PRESALE_ADDRESS,
    PRESALE_ABI,
    signer
);

// Make purchase with referral
const referrer = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const tx = await presale.buyWithBNB(referrer, {
    value: ethers.utils.parseEther("0.1") // 0.1 BNB
});
await tx.wait();

// Query referral info
const info = await presale.getReferralInfo(userAddress);
console.log("Referrer:", info.referrer);
console.log("Bonuses Earned:", ethers.utils.formatEther(info.totalBonus), "NDG");
console.log("Referral Count:", info.referralCount.toString());

// Get all referrals
const referrals = await presale.getReferrals(userAddress);
console.log("My Referrals:", referrals);
```

## 📊 Events

### ReferralBonus Event

Emitted when a referral bonus is allocated:

```solidity
event ReferralBonus(
    address indexed referrer,
    address indexed buyer,
    uint256 bonusTokens,
    uint256 usdAmount,
    uint256 timestamp
);
```

### Listening to Events

```javascript
// Listen for referral bonuses
presale.on("ReferralBonus", (referrer, buyer, bonusTokens, usdAmount, timestamp) => {
    console.log(`${referrer} earned ${ethers.utils.formatEther(bonusTokens)} NDG`);
    console.log(`From ${buyer}'s purchase of $${ethers.utils.formatEther(usdAmount)}`);
});
```

## 🎨 Frontend Examples

### React Component Example

```jsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function ReferralStats({ userAddress, presaleContract }) {
    const [stats, setStats] = useState({
        referralCount: 0,
        totalBonus: '0',
        referrals: []
    });

    useEffect(() => {
        async function loadStats() {
            const info = await presaleContract.getReferralInfo(userAddress);
            const referrals = await presaleContract.getReferrals(userAddress);
            
            setStats({
                referralCount: info.referralCount.toNumber(),
                totalBonus: ethers.utils.formatEther(info.totalBonus),
                referrals: referrals
            });
        }
        
        loadStats();
    }, [userAddress, presaleContract]);

    return (
        <div className="referral-stats">
            <h3>Your Referral Stats</h3>
            <p>Total Referrals: {stats.referralCount}</p>
            <p>Total Bonuses: {stats.totalBonus} NDG</p>
            <div>
                <h4>Your Referrals:</h4>
                {stats.referrals.map(addr => (
                    <div key={addr}>{addr}</div>
                ))}
            </div>
        </div>
    );
}
```

### Purchase Form with Referral

```jsx
function PurchaseForm({ presaleContract }) {
    const [bnbAmount, setBnbAmount] = useState('0.1');
    const [referrer, setReferrer] = useState('');

    async function handlePurchase() {
        try {
            // Use address(0) if no referrer
            const referrerAddr = referrer || ethers.constants.AddressZero;
            
            const tx = await presaleContract.buyWithBNB(referrerAddr, {
                value: ethers.utils.parseEther(bnbAmount)
            });
            
            await tx.wait();
            alert('Purchase successful!');
        } catch (error) {
            console.error(error);
            alert('Purchase failed');
        }
    }

    return (
        <div className="purchase-form">
            <input 
                type="text" 
                placeholder="BNB Amount"
                value={bnbAmount}
                onChange={e => setBnbAmount(e.target.value)}
            />
            <input 
                type="text" 
                placeholder="Referrer Address (optional)"
                value={referrer}
                onChange={e => setReferrer(e.target.value)}
            />
            <button onClick={handlePurchase}>
                Buy NDG Tokens
            </button>
        </div>
    );
}
```

## 🔒 Security Features

1. **Self-Referral Prevention**: Users cannot refer themselves
2. **Zero Address Check**: Invalid referrer addresses are ignored
3. **One-Time Relationship**: Referral link is established on first purchase only
4. **Rate Limit**: Maximum 20% bonus (configurable by owner)
5. **Transparent Tracking**: All referrals and bonuses are on-chain

## 📈 Best Practices

### For Referrers

1. **Share Responsibly**: Only promote to genuinely interested parties
2. **Provide Value**: Help buyers understand the presale mechanics
3. **Track Performance**: Monitor your referral stats on-chain
4. **Be Available**: Support your referrals with questions

### For Developers

1. **Validate Addresses**: Check referrer address format before submission
2. **Handle Errors**: Gracefully handle failed transactions
3. **Show Preview**: Display expected bonus before purchase
4. **Update UI**: Refresh stats after purchases complete

### For Buyers

1. **Verify Referrer**: Ensure referrer address is correct before submitting
2. **Optional Use**: Don't feel pressured to use a referrer
3. **One Chance**: Your first purchase establishes the referral link
4. **Check Stats**: You can verify your referrer on-chain anytime

## 🧪 Testing

See the test scripts for validation:
- `scripts/test-referral-system.js` - Core referral functionality
- `scripts/test-1-stablecoin-purchase.js` - Stablecoin purchases with referrals
- All tests validate the 5% bonus calculation

## ❓ FAQ

**Q: Do I have to use a referrer?**  
A: No, it's completely optional. Pass `address(0)` for no referral.

**Q: Can I change my referrer later?**  
A: No, the referrer is set on your first purchase and cannot be changed.

**Q: Does the referrer bonus reduce my tokens?**  
A: No! The bonus comes from the presale allocation, not from your purchase.

**Q: Are referral bonuses vested?**  
A: No, all referral bonuses are immediate tokens (no vesting period).

**Q: Can I refer myself?**  
A: No, the contract prevents self-referrals.

**Q: What if I provide an invalid referrer address?**  
A: The contract ignores invalid addresses (including address(0)) and your purchase proceeds normally.

**Q: How do I track my referrals?**  
A: Use the `getReferralInfo()` or `getReferrals()` functions to query on-chain data.

## 📞 Support

For questions or issues:
- GitHub: [JoDa-NetDAG/netdag-presale](https://github.com/JoDa-NetDAG/netdag-presale)
- Contract: [View on BSCScan](https://testnet.bscscan.com/address/0x470C714fd4B2a7EE9988680738F0aC25558A8c77)

## 🔗 References

- BSC Testnet Deployment: `0x470C714fd4B2a7EE9988680738F0aC25558A8c77`
- Referral Bonus Rate: **5%** (500 basis points)
- Smart Contract: `PresaleWithVesting.sol`
