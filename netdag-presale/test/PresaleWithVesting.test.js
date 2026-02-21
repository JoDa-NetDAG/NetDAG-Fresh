const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PresaleWithVesting", function () {
    let ndgToken;
    let vestingVault;
    let presale;
    let mockPriceFeed;
    let owner;
    let liquidityFund;
    let buyer1;
    let buyer2;

    beforeEach(async function () {
        [owner, liquidityFund, buyer1, buyer2] = await ethers.getSigners();

        // Deploy NDG Token
        const NDGToken = await ethers.getContractFactory("NDGToken");
        const initialSupply = ethers.parseEther("1000000000");
        ndgToken = await NDGToken.deploy(initialSupply);

        // Deploy Mock Price Feed
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockV3Aggregator.deploy(8, 60000000000);

        // Deploy VestingVault with all 4 arguments
        const VestingVault = await ethers.getContractFactory("VestingVault");
        vestingVault = await VestingVault.deploy(
            ndgToken.target,
            liquidityFund.address,
            mockPriceFeed.target,
            []
        );

        // Deploy Presale with all 4 arguments
        const PresaleWithVesting = await ethers.getContractFactory("PresaleWithVesting");
        presale = await PresaleWithVesting.deploy(
            ndgToken.target,
            vestingVault.target,
            mockPriceFeed.target,
            []
        );

        // Configure
        await vestingVault.setPresaleContract(presale.target);
        const presaleAllocation = ethers.parseEther("400000000");
        await ndgToken.transfer(vestingVault.target, presaleAllocation);

        // Start presale
        await presale.startPresale();
    });

    describe("Deployment", function () {
        it("Should set correct addresses", async function () {
            expect(await presale.ndgToken()).to.equal(ndgToken.target);
            expect(await presale.vestingVault()).to.equal(vestingVault.target);
            expect(await presale.bnbPriceFeed()).to.equal(mockPriceFeed.target);
        });

        it("Should initialize with tier 0", async function () {
            expect(await presale.currentTier()).to.equal(0);
        });

        it("Should set correct tier 0 price", async function () {
            const tierInfo = await presale.getCurrentTierInfo();
            expect(tierInfo.price).to.equal(ethers.parseEther("0.006"));
        });
    });

    describe("Token Purchase", function () {
        it("Should allow buying tokens with BNB", async function () {
            const bnbAmount = ethers.parseEther("1");

            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const userInfo = await vestingVault.getUserInfo(buyer1.address);
            expect(userInfo.totalTokens).to.be.gt(0);
        });

        it("Should enforce minimum purchase", async function () {
            const smallAmount = ethers.parseEther("0.001");

            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: smallAmount })
            ).to.be.revertedWith("Below minimum");
        });

        it("Should calculate tokens correctly at anchor price", async function () {
            const bnbAmount = ethers.parseEther("1");
            const bnbPrice = await presale.getBNBPrice();
            const usdAmount = (bnbAmount * bnbPrice) / ethers.parseEther("1");

            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const userAlloc = await presale.getUserAllocation(buyer1.address);
            const expectedTotal = (usdAmount * ethers.parseEther("1")) / ethers.parseEther("0.01");

            expect(userAlloc.totalTokens).to.be.closeTo(expectedTotal, ethers.parseEther("1000"));
        });

        it("Should track total USD raised", async function () {
            const bnbAmount = ethers.parseEther("1");

            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            expect(await presale.totalRaisedUSD()).to.be.gt(0);
        });
    });

    describe("Tier System", function () {
        it("Should start at tier 0", async function () {
            const tierInfo = await presale.getCurrentTierInfo();
            expect(tierInfo.tierIndex).to.equal(0);
        });

        it("Should preview purchase correctly", async function () {
            const usdAmount = ethers.parseEther("1000");
            const preview = await presale.previewPurchase(usdAmount);

            expect(preview.totalTokens).to.be.gt(0);
            expect(preview.immediateTokens).to.be.gt(0);
            expect(preview.vestingTokens).to.equal(0);
        });
    });

    describe("Presale Control", function () {
        it("Should allow owner to pause presale", async function () {
            await presale.pause();

            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow owner to unpause presale", async function () {
            await presale.pause();
            await presale.unpause();

            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            expect(await presale.totalRaisedUSD()).to.be.gt(0);
        });

        it("Should allow owner to withdraw BNB", async function () {
            const bnbAmount = ethers.parseEther("1");
            await presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: bnbAmount });

            const initialBalance = await ethers.provider.getBalance(owner.address);
            await presale.withdrawBNB();
            const finalBalance = await ethers.provider.getBalance(owner.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should allow owner to trigger TGE", async function () {
            await presale.triggerTGE();
            expect(await presale.tgeTriggered()).to.equal(true);
        });

        it("Should prevent purchases after TGE", async function () {
            await presale.triggerTGE();

            await expect(
                presale.connect(buyer1).buyWithBNB(ethers.ZeroAddress, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Presale ended");
        });
    });
});