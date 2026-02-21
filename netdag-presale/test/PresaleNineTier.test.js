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

        const NDGToken = await ethers.getContractFactory("NDGToken");
        const initialSupply = ethers.parseEther("1000000000");
        ndgToken = await NDGToken.deploy(initialSupply);

        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockV3Aggregator.deploy(8, 60000000000);

        const VestingVault = await ethers.getContractFactory("VestingVault");
        vestingVault = await VestingVault.deploy(
            ndgToken.target,
            liquidityFund.address,
            mockPriceFeed.target,
            []
        );

        const PresaleWithVesting = await ethers.getContractFactory("PresaleWithVesting");
        presale = await PresaleWithVesting.deploy(
            ndgToken.target,
            vestingVault.target,
            mockPriceFeed.target,
            []
        );

        await vestingVault.setPresaleContract(presale.target);
        await vestingVault.setTreasuryAddress(treasury.address);
        const presaleAllocation = ethers.parseEther("600000000");
        await ndgToken.transfer(vestingVault.target, presaleAllocation);
    });

    describe("9-Tier Initialization", function () {
        it("Should initialize with 9 tiers", async function () {
            const tier0 = await presale.tiers(0);
            expect(tier0.price).to.equal(ethers.parseEther("0.006"));
            expect(tier0.baseCap).to.equal(ethers.parseEther("108000000"));
            expect(tier0.totalAvailable).to.equal(ethers.parseEther("108000000"));

            const tier4 = await presale.tiers(4);
            expect(tier4.price).to.equal(ethers.parseEther("0.021"));
            expect(tier4.baseCap).to.equal(ethers.parseEther("60000000"));

            const tier8 = await presale.tiers(8);
            expect(tier8.price).to.equal(ethers.parseEther("0.16"));
            expect(tier8.baseCap).to.equal(ethers.parseEther("30000000"));
        });

        it("Should start at tier 0", async function () {
            expect(await presale.currentTier()).to.equal(0);
        });

        it("Should have correct total presale allocation", async function () {
            let totalAllocation = 0n;
            for (let i = 0; i < 9; i++) {
                const tier = await presale.tiers(i);
                totalAllocation = totalAllocation + tier.baseCap;
            }
            expect(totalAllocation).to.equal(ethers.parseEther("600000000"));
        });
    });

    describe("Presale Start", function () {
        it("Should not allow purchases before presale starts", async function () {
            const bnbAmount = ethers.parseEther("1");
            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount })
            ).to.be.revertedWith("Presale not started");
        });

        it("Should allow owner to start presale", async function () {
            await presale.startPresale();
            const presaleStartTime = await presale.presaleStartTime();
            expect(presaleStartTime).to.be.gt(0);

            const presaleEndTime = await presale.presaleEndTime();
            const expectedEndTime = presaleStartTime + BigInt(270 * 24 * 60 * 60);
            expect(presaleEndTime).to.equal(expectedEndTime);
        });

        it("Should initialize tier 0 timing when presale starts", async function () {
            await presale.startPresale();
            const tier0 = await presale.tiers(0);
            expect(tier0.startTime).to.be.gt(0);
            expect(tier0.endTime).to.equal(tier0.startTime + BigInt(30 * 24 * 60 * 60));
        });

        it("Should not allow starting presale twice", async function () {
            await presale.startPresale();
            await expect(presale.startPresale()).to.be.revertedWith("Already started");
        });
    });

    describe("Token Purchase with 9-Tier System", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should allow buying tokens in tier 1 at $0.006", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const userAlloc = await presale.getUserAllocation(buyer1.address);
            expect(userAlloc.totalTokens).to.be.gt(0);

            const expectedTotal = ethers.parseEther("60000");
            expect(userAlloc.totalTokens).to.be.closeTo(expectedTotal, ethers.parseEther("100"));
        });

        it("Should calculate immediate tokens at tier price ($0.006)", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const userAlloc = await presale.getUserAllocation(buyer1.address);
            const expectedImmediate = ethers.parseEther("100000");
            expect(userAlloc.immediateTokens).to.be.closeTo(expectedImmediate, ethers.parseEther("100"));
        });

        it("Should track sold tokens in tier", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const tier0 = await presale.tiers(0);
            expect(tier0.sold).to.be.gt(0);
        });
    });

    describe("Tier Advancement - Sold Out", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should advance tier when sold out", async function () {
            const selloutAmount = ethers.parseEther("1080");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: selloutAmount });

            const currentTier = await presale.currentTier();
            expect(currentTier).to.be.gte(1);
        });

        it("Should emit TierSoldOut event when tier sells out", async function () {
            const selloutAmount = ethers.parseEther("1080");
            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: selloutAmount })
            ).to.emit(presale, "TierSoldOut");
        });

        it("Should emit TierAdvanced event with SOLD_OUT reason", async function () {
            const selloutAmount = ethers.parseEther("1080");
            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: selloutAmount })
            ).to.emit(presale, "TierAdvanced");
        });
    });

    describe("Tier Advancement - Time Expiry", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should advance tier after 30 days", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();

            expect(await presale.currentTier()).to.equal(1);
        });

        it("Should calculate rollover tokens when advancing by time", async function () {
            const bnbAmount = ethers.parseEther("10");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const tier0Before = await presale.tiers(0);
            const sold = tier0Before.sold;
            const unsold = tier0Before.totalAvailable - sold;

            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();

            const tier1 = await presale.tiers(1);
            expect(tier1.rolloverTokens).to.be.closeTo(unsold, ethers.parseEther("1"));
            expect(tier1.totalAvailable).to.equal(tier1.baseCap + tier1.rolloverTokens);
        });

        it("Should emit TierAdvanced event with TIME_EXPIRED reason", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            await time.increase(30 * 24 * 60 * 60 + 1);
            await expect(presale.checkAndAdvanceTier()).to.emit(presale, "TierAdvanced");
        });
    });

    describe("Rollover Mechanism", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should roll over unsold tokens to next tier", async function () {
            const usd50M = ethers.parseEther("300000");
            const bnbAmount = usd50M / 600n;
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const tier0 = await presale.tiers(0);
            const unsold = tier0.totalAvailable - tier0.sold;

            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();

            const tier1 = await presale.tiers(1);
            expect(tier1.rolloverTokens).to.be.closeTo(unsold, ethers.parseEther("100"));
            expect(tier1.totalAvailable).to.equal(tier1.baseCap + tier1.rolloverTokens);
        });

        it("Should have zero rollover when tier fully sells out", async function () {
            const selloutAmount = ethers.parseEther("648000");
            const bnbAmount = selloutAmount / 600n;
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const currentTier = await presale.currentTier();
            if (currentTier >= 1) {
                const tier1 = await presale.tiers(1);
                expect(tier1.rolloverTokens).to.be.lt(ethers.parseEther("1000"));
            }
        });

        it("Should accumulate rollover across multiple tiers", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();

            const tier1Before = await presale.tiers(1);
            const rollover1 = tier1Before.rolloverTokens;

            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            await time.increase(30 * 24 * 60 * 60 + 1);
            await presale.checkAndAdvanceTier();

            const tier2 = await presale.tiers(2);
            expect(tier2.rolloverTokens).to.be.gt(rollover1);
        });
    });

    describe("Finalization and Burn", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should not allow finalization before presale ends", async function () {
            await expect(presale.finalizePresale()).to.be.revertedWith("Presale still active");
        });

        it("Should allow finalization after 270 days", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            await presale.finalizePresale();
            expect(await presale.finalized()).to.equal(true);
        });

        it("Should allow finalization when all 9 tiers complete", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            await presale.finalizePresale();
            expect(await presale.finalized()).to.equal(true);
        });

        it("Should emit PresaleFinalized event", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            await expect(presale.finalizePresale()).to.emit(presale, "PresaleFinalized");
        });

        it("Should emit TokensBurned event if there are unsold tokens", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            await time.increase(270 * 24 * 60 * 60 + 1);
            await expect(presale.finalizePresale()).to.emit(presale, "UnsoldToTreasury");
        });

        it("Should not allow finalization twice", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);
            await presale.finalizePresale();
            await expect(presale.finalizePresale()).to.be.revertedWith("Already finalized");
        });
    });

    describe("Edge Cases", function () {
        beforeEach(async function () {
            await presale.startPresale();
        });

        it("Should handle purchase that spans multiple tiers", async function () {
            const largeAmount = ethers.parseEther("1000");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: largeAmount });

            const userAlloc = await presale.getUserAllocation(buyer1.address);
            expect(userAlloc.totalTokens).to.be.gt(0);
        });

        it("Should not allow purchases after presale period ends", async function () {
            await time.increase(270 * 24 * 60 * 60 + 1);

            const bnbAmount = ethers.parseEther("1");
            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount })
            ).to.be.revertedWith("Presale period ended");
        });

        it("Should handle tier advancement in the middle of a purchase", async function () {
            const tier0 = await presale.tiers(0);
            const almostAllUSD = ethers.parseEther("640000");
            const bnbAmount1 = almostAllUSD / 600n;
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount1 });

            const bnbAmount2 = ethers.parseEther("17");
            await presale.connect(buyer2).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount2 });

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
            expect(tierInfo.price).to.equal(ethers.parseEther("0.006"));
            expect(tierInfo.totalAvailable).to.equal(ethers.parseEther("108000000"));
            expect(tierInfo.sold).to.equal(0);
            expect(tierInfo.remaining).to.equal(ethers.parseEther("108000000"));
        });

        it("Should preview purchase correctly in 9-tier system", async function () {
            const usdAmount = ethers.parseEther("1000");
            const preview = await presale.previewPurchase(usdAmount);

            expect(preview.totalTokens).to.equal(ethers.parseEther("100000"));

            const expectedImmediate = ethers.parseEther("166666.666666666666666666");
            expect(preview.immediateTokens).to.be.closeTo(expectedImmediate, ethers.parseEther("1"));
        });
    });
});