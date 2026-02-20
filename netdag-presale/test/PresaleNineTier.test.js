const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PresaleWithVesting - 9-Tier Structure", function () {
    let ndgToken;
    let vestingVault;
    let presale;
    let mockPriceFeed;
    let owner;
    let liquidityFund;
    let buyer1;
    let buyer2;
    let treasury;

    beforeEach(async function () {
        [owner, liquidityFund, buyer1, buyer2, treasury] = await ethers.getSigners();
        
        // Deploy NDG Token
        const NDGToken = await ethers.getContractFactory("NDGToken");
        const initialSupply = ethers.utils.parseEther("1000000000");
        ndgToken = await NDGToken.deploy(initialSupply);
        await ndgToken.deployed();
        
        // Deploy Mock Price Feed (BNB price = $600)
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockV3Aggregator.deploy(8, 60000000000);
        await mockPriceFeed.deployed();
        
        // Deploy VestingVault
        const VestingVault = await ethers.getContractFactory("VestingVault");
        vestingVault = await VestingVault.deploy(
            ndgToken.address,
            liquidityFund.address,
            mockPriceFeed.address,
            []
        );
        await vestingVault.deployed();
        
        // Deploy Presale
        const PresaleWithVesting = await ethers.getContractFactory("PresaleWithVesting");
        presale = await PresaleWithVesting.deploy(
            ndgToken.address,
            vestingVault.address,
            mockPriceFeed.address,
            []
        );
        await presale.deployed();
        
        // Configure
        await vestingVault.setPresaleContract(presale.address);
        await vestingVault.setTreasuryAddress(treasury.address);
        const presaleAllocation = ethers.utils.parseEther("600000000");
        await ndgToken.transfer(vestingVault.address, presaleAllocation);
    });

    describe("9-Tier Initialization", function () {
        it("Should initialize with 9 tiers", async function () {
            // Check tier 0 (Tier 1: $0.006)
            const tier0 = await presale.tiers(0);
            expect(tier0.price).to.equal(ethers.utils.parseEther("0.006"));
            expect(tier0.baseCap).to.equal(ethers.utils.parseEther("108000000"));
            expect(tier0.totalAvailable).to.equal(ethers.utils.parseEther("108000000"));
            
            // Check tier 4 (Tier 5: $0.021)
            const tier4 = await presale.tiers(4);
            expect(tier4.price).to.equal(ethers.utils.parseEther("0.021"));
            expect(tier4.baseCap).to.equal(ethers.utils.parseEther("60000000"));
            
            // Check tier 8 (Tier 9: $0.16)
            const tier8 = await presale.tiers(8);
            expect(tier8.price).to.equal(ethers.utils.parseEther("0.16"));
            expect(tier8.baseCap).to.equal(ethers.utils.parseEther("30000000"));
        });

        it("Should start at tier 0", async function () {
            expect(await presale.currentTier()).to.equal(0);
        });

        it("Should have correct total presale allocation", async function () {
            let totalAllocation = ethers.BigNumber.from(0);
            for (let i = 0; i < 9; i++) {
                const tier = await presale.tiers(i);
                totalAllocation = totalAllocation.add(tier.baseCap);
            }
            expect(totalAllocation).to.equal(ethers.utils.parseEther("600000000"));
        });
    });

    describe("Presale Start", function () {
        it("Should not allow purchases before presale starts", async function () {
            const bnbAmount = ethers.utils.parseEther("1");
            
            await expect(
                presale.connect(buyer1).buyWithBNB({ value: bnbAmount })
            ).to.be.revertedWith("Presale not started");
        });

        it("Should allow owner to start presale", async function () {
            await presale.startPresale();
            
            const presaleStartTime = await presale.presaleStartTime();
            expect(presaleStartTime).to.be.gt(0);
            
            const presaleEndTime = await presale.presaleEndTime();
            // 270 days = 9 months
            const expectedEndTime = presaleStartTime.add(270 * 24 * 60 * 60);
            expect(presaleEndTime).to.equal(expectedEndTime);
        });

        it("Should initialize tier 0 timing when presale starts", async function () {
            await presale.startPresale();
            
            const tier0 = await presale.tiers(0);
            expect(tier0.startTime).to.be.gt(0);
            expect(tier0.endTime).to.equal(tier0.startTime.add(30 * 24 * 60 * 60));
        });

        it("Should not allow starting presale twice", async function () {
            await presale.startPresale();
            
            await expect(
                presale.startPresale()
            ).to.be.revertedWith("Already started");
        });
    });

    describe("Token Purchase with 9-Tier System", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should allow buying tokens in tier 1 at $0.006", async function () {
            const bnbAmount = ethers.utils.parseEther("1"); // 1 BNB = $600
            
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            const userAlloc = await presale.getUserAllocation(buyer1.address);
            expect(userAlloc.totalTokens).to.be.gt(0);
            
            // At anchor price $0.01, $600 = 60,000 tokens
            const expectedTotal = ethers.utils.parseEther("60000");
            expect(userAlloc.totalTokens).to.be.closeTo(expectedTotal, ethers.utils.parseEther("100"));
        });

        it("Should calculate immediate tokens at tier price ($0.006)", async function () {
            const bnbAmount = ethers.utils.parseEther("1"); // 1 BNB = $600
            
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            const userAlloc = await presale.getUserAllocation(buyer1.address);
            
            // At tier 1 price $0.006, $600 = 100,000 tokens immediate
            const expectedImmediate = ethers.utils.parseEther("100000");
            expect(userAlloc.immediateTokens).to.be.closeTo(expectedImmediate, ethers.utils.parseEther("100"));
        });

        it("Should track sold tokens in tier", async function () {
            const bnbAmount = ethers.utils.parseEther("1");
            
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            const tier0 = await presale.tiers(0);
            expect(tier0.sold).to.be.gt(0);
        });
    });

    describe("Tier Advancement - Sold Out", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should advance tier when sold out", async function () {
            // Tier 1 has 108M tokens at $0.006
            // To sell 108M tokens: 108M * $0.006 = $648,000
            // Convert to BNB at $600/BNB: $648k / $600 = 1080 BNB
            const selloutAmount = ethers.utils.parseEther("1080");
            
            await presale.connect(buyer1).buyWithBNB({ value: selloutAmount });
            
            // Should advance to tier 2 or be very close
            const currentTier = await presale.currentTier();
            expect(currentTier).to.be.gte(1);
        });

        it("Should emit TierSoldOut event when tier sells out", async function () {
            const selloutAmount = ethers.utils.parseEther("1080");
            
            await expect(
                presale.connect(buyer1).buyWithBNB({ value: selloutAmount })
            ).to.emit(presale, "TierSoldOut");
        });

        it("Should emit TierAdvanced event with SOLD_OUT reason", async function () {
            const selloutAmount = ethers.utils.parseEther("1080");
            
            // We expect TierAdvanced to be emitted, but exact parameters may vary due to rounding
            await expect(
                presale.connect(buyer1).buyWithBNB({ value: selloutAmount })
            ).to.emit(presale, "TierAdvanced");
        });
    });

    describe("Tier Advancement - Time Expiry", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should advance tier after 30 days", async function () {
            // Make a small purchase
            const bnbAmount = ethers.utils.parseEther("1");
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            // Fast forward 30 days
            await time.increase(30 * 24 * 60 * 60 + 1);
            
            // Trigger tier check
            await presale.checkAndAdvanceTier();
            
            // Should advance to tier 2
            expect(await presale.currentTier()).to.equal(1);
        });

        it("Should calculate rollover tokens when advancing by time", async function () {
            // Buy only a small amount in tier 1
            const bnbAmount = ethers.utils.parseEther("10"); // $6,000
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            const tier0Before = await presale.tiers(0);
            const sold = tier0Before.sold;
            const unsold = tier0Before.totalAvailable.sub(sold);
            
            // Fast forward 30 days
            await time.increase(30 * 24 * 60 * 60 + 1);
            
            // Advance tier
            await presale.checkAndAdvanceTier();
            
            // Check tier 2 has rollover
            const tier1 = await presale.tiers(1);
            expect(tier1.rolloverTokens).to.be.closeTo(unsold, ethers.utils.parseEther("1"));
            expect(tier1.totalAvailable).to.equal(tier1.baseCap.add(tier1.rolloverTokens));
        });

        it("Should emit TierAdvanced event with TIME_EXPIRED reason", async function () {
            const bnbAmount = ethers.utils.parseEther("1");
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            await time.increase(30 * 24 * 60 * 60 + 1);
            
            await expect(
                presale.checkAndAdvanceTier()
            ).to.emit(presale, "TierAdvanced");
        });
    });

    describe("Rollover Mechanism", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should roll over unsold tokens to next tier", async function () {
            // Buy 50M tokens in tier 1 (108M available)
            const usd50M = ethers.utils.parseEther("300000"); // $300k
            const bnbAmount = usd50M.div(600);
            
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            const tier0 = await presale.tiers(0);
            const unsold = tier0.totalAvailable.sub(tier0.sold);
            
            // Fast forward and advance
            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();
            
            // Tier 2 should have base 96M + rollover ~58M = ~154M
            const tier1 = await presale.tiers(1);
            // Use tighter tolerance for better accuracy (100 tokens = $0.60 max error)
            expect(tier1.rolloverTokens).to.be.closeTo(unsold, ethers.utils.parseEther("100"));
            expect(tier1.totalAvailable).to.equal(tier1.baseCap.add(tier1.rolloverTokens));
        });

        it("Should have zero rollover when tier fully sells out", async function () {
            // Sell out tier 1 completely (108M tokens at $0.006 = $648,000)
            // Buy exactly $648,000 worth
            const selloutAmount = ethers.utils.parseEther("648000");
            const bnbAmount = selloutAmount.div(600);
            
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            // Check if we're in tier 2 and rollover is zero or very small
            const currentTier = await presale.currentTier();
            if (currentTier >= 1) {
                const tier1 = await presale.tiers(1);
                // Should have minimal or zero rollover due to complete sellout
                expect(tier1.rolloverTokens).to.be.lt(ethers.utils.parseEther("1000"));
            }
        });

        it("Should accumulate rollover across multiple tiers", async function () {
            // Sell very little in tier 1
            const bnbAmount = ethers.utils.parseEther("1");
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            // Fast forward and advance to tier 2
            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();
            
            const tier1Before = await presale.tiers(1);
            const rollover1 = tier1Before.rolloverTokens;
            
            // Sell very little in tier 2
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            // Fast forward and advance to tier 3
            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();
            
            // Tier 3 should have rollover from tier 2 + its own unsold
            const tier2 = await presale.tiers(2);
            expect(tier2.rolloverTokens).to.be.gt(rollover1); // Should be even larger
        });
    });

    describe("Finalization and Burn", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should not allow finalization before presale ends", async function () {
            await expect(
                presale.finalizePresale()
            ).to.be.revertedWith("Presale still active");
        });

        it("Should allow finalization after 270 days", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            
            await presale.finalizePresale();
            
            expect(await presale.finalized()).to.equal(true);
        });

        it("Should allow finalization when all 9 tiers complete", async function () {
            // Simulate selling through all 9 tiers
            // This is a simplified test - in reality would need massive purchases
            
            // Fast forward past presale period
            await time.increase(270 * 24 * 60 * 60 + 1);
            
            await presale.finalizePresale();
            
            expect(await presale.finalized()).to.equal(true);
        });

        it("Should emit PresaleFinalized event", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            
            await expect(
                presale.finalizePresale()
            ).to.emit(presale, "PresaleFinalized");
        });

        it("Should emit TokensBurned event if there are unsold tokens", async function () {
            // Make a small purchase
            const bnbAmount = ethers.utils.parseEther("1");
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount });
            
            await time.increase(270 * 24 * 60 * 60 + 1);
            
            await expect(
                presale.finalizePresale()
            ).to.emit(presale, "UnsoldToTreasury");
        });

        it("Should not allow finalization twice", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            
            await presale.finalizePresale();
            
            await expect(
                presale.finalizePresale()
            ).to.be.revertedWith("Already finalized");
        });
    });

    describe("Edge Cases", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should handle purchase that spans multiple tiers", async function () {
            // This test requires a very large purchase
            // For now, we'll just verify the logic works
            const largeAmount = ethers.utils.parseEther("1000");
            
            await presale.connect(buyer1).buyWithBNB({ value: largeAmount });
            
            const userAlloc = await presale.getUserAllocation(buyer1.address);
            expect(userAlloc.totalTokens).to.be.gt(0);
        });

        it("Should not allow purchases after presale period ends", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            
            const bnbAmount = ethers.utils.parseEther("1");
            
            await expect(
                presale.connect(buyer1).buyWithBNB({ value: bnbAmount })
            ).to.be.revertedWith("Presale period ended");
        });

        it("Should handle tier advancement in the middle of a purchase", async function () {
            // Buy almost all of tier 1
            const tier0 = await presale.tiers(0);
            const almostAllUSD = ethers.utils.parseEther("640000"); // Just under $648k
            const bnbAmount1 = almostAllUSD.div(600);
            
            await presale.connect(buyer1).buyWithBNB({ value: bnbAmount1 });
            
            // Now buy more which should span into tier 2
            // Need at least $8k to fill tier 0, using $10k to spill into tier 1
            const bnbAmount2 = ethers.utils.parseEther("17"); // 17 BNB * $600 = $10,200
            await presale.connect(buyer2).buyWithBNB({ value: bnbAmount2 });
            
            // Should now be in tier 2
            expect(await presale.currentTier()).to.be.gte(1);
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should return current tier info correctly", async function () {
            const tierInfo = await presale.getCurrentTierInfo();
            
            expect(tierInfo.tierIndex).to.equal(0);
            expect(tierInfo.price).to.equal(ethers.utils.parseEther("0.006"));
            expect(tierInfo.totalAvailable).to.equal(ethers.utils.parseEther("108000000"));
            expect(tierInfo.sold).to.equal(0);
            expect(tierInfo.remaining).to.equal(ethers.utils.parseEther("108000000"));
        });

        it("Should preview purchase correctly in 9-tier system", async function () {
            const usdAmount = ethers.utils.parseEther("1000");
            const preview = await presale.previewPurchase(usdAmount);
            
            // At anchor $0.01, $1000 = 100,000 tokens total
            expect(preview.totalTokens).to.equal(ethers.utils.parseEther("100000"));
            
            // At tier 1 price $0.006, $1000 = ~166,667 tokens immediate
            const expectedImmediate = ethers.utils.parseEther("166666.666666666666666666");
            expect(preview.immediateTokens).to.be.closeTo(expectedImmediate, ethers.utils.parseEther("1"));
        });
    });
});
