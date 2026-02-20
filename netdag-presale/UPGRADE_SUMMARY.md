# Presale 9-Tier Structure Upgrade Summary

## Overview
Successfully upgraded the NetDAG presale smart contract from a 5-tier system to a 9-tier system with dual-condition tier progression, unsold token rollover, and final burn mechanism.

## Key Changes

### 1. PresaleWithVesting.sol

#### Tier Structure (Lines 44-52)
- **Updated Tier struct** to include:
  - `baseCap`: Original NDG allocation for tier
  - `rolloverTokens`: Unsold tokens from previous tier
  - `totalAvailable`: baseCap + rolloverTokens
  - `sold`: Total tokens sold in tier
  - `startTime`: When tier started
  - `endTime`: When tier ends (startTime + 30 days)

#### 9-Tier Configuration (Lines 125-249)
| Tier | Price (USD) | Base NDG Cap | Max Duration |
|------|-------------|--------------|--------------|
| 1 | $0.006 | 108,000,000 | 30 days |
| 2 | $0.009 | 96,000,000 | 30 days |
| 3 | $0.013 | 84,000,000 | 30 days |
| 4 | $0.017 | 72,000,000 | 30 days |
| 5 | $0.021 | 60,000,000 | 30 days |
| 6 | $0.025 | 60,000,000 | 30 days |
| 7 | $0.028 | 48,000,000 | 30 days |
| 8 | $0.12 | 42,000,000 | 30 days |
| 9 | $0.16 | 30,000,000 | 30 days |

**Total Presale Allocation:** 600,000,000 NDG

#### New State Variables (Lines 75-77)
- `presaleStartTime`: When presale begins
- `presaleEndTime`: When presale ends (270 days from start)
- `finalized`: Whether presale has been finalized

#### Dual-Condition Tier Advancement (Lines 300-323)
**Function:** `checkAndAdvanceTier()`
- Advances tier when **30 days pass OR tier sells out** (whichever first)
- Calculates unsold tokens and rolls them to next tier
- Emits `TierAdvanced` event with rollover amount and reason ("SOLD_OUT" or "TIME_EXPIRED")

#### Updated Purchase Logic (Lines 325-450)
- Checks tier capacity against `totalAvailable` (baseCap + rollover)
- Automatically calls `checkAndAdvanceTier()` before purchase
- Tracks `sold` amount per tier
- Emits `TierSoldOut` event when tier reaches capacity
- Handles purchases spanning multiple tiers

#### Presale Start Function (Lines 576-589)
**Function:** `startPresale()`
- Initializes presale timing
- Sets `presaleEndTime` to 270 days (9 months) from start
- Initializes first tier timing

#### Burn Mechanism (Lines 592-626)
**Function:** `finalizePresaleAndBurn()`
- Can be called after 270 days OR when all 9 tiers complete
- Calculates total unsold tokens across all tiers
- Calls `vestingVault.burnUnallocatedTokens()` to burn unsold tokens
- Emits events:
  - `TokensBurned(amount, timestamp)`
  - `FinalSupplyReduced(newTotalSupply)`
  - `PresaleFinalized(totalSold, totalBurned)`

#### New Events (Lines 111-120)
- `TierAdvanced(uint256 indexed newTier, uint256 totalAvailable, uint256 rolloverAmount, string reason)`
- `TierSoldOut(uint256 indexed tier, uint256 totalSold)`
- `TokensBurned(uint256 amount, uint256 timestamp)`
- `FinalSupplyReduced(uint256 newTotalSupply)`
- `PresaleFinalized(uint256 totalSold, uint256 totalBurned)`
- `PresaleStarted(uint256 startTime, uint256 endTime)`

### 2. VestingVault.sol

#### New Function (Lines 538-547)
**Function:** `burnUnallocatedTokens(uint256 amount)`
- Called by presale contract after finalization
- Burns unsold tokens using NDGToken's burn() function
- Only callable by presale contract (via `onlyPresale` modifier)

#### New Interface (Lines 550-553)
**Interface:** `INDGToken`
- Defines burn function interface for NDGToken

### 3. Updated Interfaces

#### IVestingVault (Lines 25-33)
- Added `burnUnallocatedTokens(uint256 amount)` function

## Test Coverage

### PresaleNineTier.test.js
Comprehensive test suite covering:

1. **9-Tier Initialization**
   - Verify all 9 tiers initialized correctly
   - Verify tier prices and caps
   - Verify total allocation = 600M NDG

2. **Presale Start**
   - Cannot purchase before presale starts
   - Owner can start presale
   - First tier timing initialized
   - Cannot start twice

3. **Token Purchase**
   - Purchase tokens at tier 1 ($0.006)
   - Calculate immediate tokens correctly
   - Track sold tokens per tier

4. **Tier Advancement - Sold Out**
   - Advance when tier sells out
   - Emit TierSoldOut event
   - Emit TierAdvanced with "SOLD_OUT" reason

5. **Tier Advancement - Time Expiry**
   - Advance after 30 days
   - Calculate rollover correctly
   - Emit TierAdvanced with "TIME_EXPIRED" reason

6. **Rollover Mechanism**
   - Roll over unsold tokens to next tier
   - Zero rollover when fully sold out
   - Accumulate rollover across multiple tiers

7. **Finalization and Burn**
   - Cannot finalize before presale ends
   - Can finalize after 270 days
   - Can finalize when all tiers complete
   - Emit burn events
   - Cannot finalize twice

8. **Edge Cases**
   - Purchase spanning multiple tiers
   - No purchases after presale period ends
   - Tier advancement during purchase

## How Rollover Works

### Example Flow:

**Tier 1:**
- Available: 108M tokens
- Sells: 80M tokens
- Unsold: 28M tokens
- **Result:** Advances to Tier 2, rolls over 28M

**Tier 2:**
- Base: 96M tokens
- Rollover: 28M tokens
- **Total Available:** 124M tokens
- Sells: 50M tokens
- Unsold: 74M tokens
- **Result:** Advances to Tier 3, rolls over 74M

**Tier 3:**
- Base: 84M tokens
- Rollover: 74M tokens
- **Total Available:** 158M tokens

## Advancement Scenarios

### Scenario A: Early Sellout
- Tier 1 sells all 108M in 15 days
- **Action:** Advance immediately to Tier 2
- **Rollover:** 0 tokens

### Scenario B: Time Expiry with Partial Sales
- Tier 2 sells 50M after 30 days
- **Action:** Advance to Tier 3
- **Rollover:** 74M tokens (124M - 50M)

### Scenario C: Mid-Purchase Sellout
- Tier 3 sells all 158M in 20 days
- **Action:** Advance immediately to Tier 4
- **Rollover:** 0 tokens

## Expected Outcomes

✅ **9-tier presale structure** with dual-condition progression  
✅ **Advances when 30 days pass OR tier sells out** (whichever first)  
✅ **Unsold tokens roll over** to next tier  
✅ **Final burn** of all unsold tokens after presale ends  
✅ **Total presale allocation:** 600M NDG  
✅ **Maximum raise:** $17,772,000 (if all sold at respective prices)  
✅ **Presale can end early** if all tiers sell out before 9 months  
✅ **Creates scarcity** through burn mechanism  
✅ **Maintains all existing vesting features** (40%/60% split)

## Vesting Structure (Unchanged)

- **40%** unlocked at TGE
- **60%** vested: 20% at 3 months, 20% at 6 months, 20% at 9 months
- Early access features intact
- Vesting cliff reduction features intact

## Deployment Notes

### Prerequisites
1. Deploy NDGToken with 1B initial supply
2. Deploy VestingVault with NDGToken address
3. Deploy PresaleWithVesting with NDGToken and VestingVault addresses

### Post-Deployment Steps
1. Transfer 600M NDG tokens to VestingVault
2. Call `setPresaleContract()` on VestingVault
3. Call `startPresale()` on PresaleWithVesting to begin

### Finalization Process
After 9 months OR all tiers complete:
1. Call `finalizePresaleAndBurn()` to burn unsold tokens
2. This calculates total unsold and burns from VestingVault
3. Events emitted for tracking

## Security Considerations

- ✅ Only owner can start presale
- ✅ Only owner can finalize and burn
- ✅ Only presale contract can call burnUnallocatedTokens on vault
- ✅ Cannot finalize twice
- ✅ Cannot purchase before presale starts
- ✅ Cannot purchase after presale ends
- ✅ Tier advancement logic prevents overflow/underflow
- ✅ All token calculations use safe math (Solidity 0.8.17)

## Gas Optimization Notes

- Tier advancement is triggered on-demand (not automatic)
- Users may need to call `checkAndAdvanceTier()` manually if 30 days pass
- Purchase function calls it automatically before processing
- Loop through tiers in finalization is bounded by 9 iterations

## Migration from 5-Tier to 9-Tier

### Breaking Changes
1. **Tier struct changed** - requires redeployment
2. **New functions added** - existing deployments won't have them
3. **Interface updates** - VestingVault interface extended

### Non-Breaking Changes
- All existing functions maintained
- View functions signature compatible
- Events backward compatible (new events added, old ones unchanged except TierAdvanced)

## Files Modified

1. `contracts/PresaleWithVesting.sol` - Main changes
2. `contracts/VestingVault.sol` - Added burn function
3. `test/PresaleWithVesting.test.js` - Updated for startPresale requirement
4. `test/PresaleNineTier.test.js` - New comprehensive test suite

## Files Not Modified (As Per Requirements)

- `contracts/NDGToken.sol` - Already has burn function
- Deployment scripts - Will need updates for production deployment

## Next Steps

1. ✅ Code implementation complete
2. ⏳ Compile and test contracts
3. ⏳ Run CodeQL security scan
4. ⏳ Code review
5. ⏳ Deploy to testnet
6. ⏳ Audit
7. ⏳ Deploy to mainnet
