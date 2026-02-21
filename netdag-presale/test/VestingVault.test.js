const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VestingVault", function () {
    let ndgToken;
    let vestingVault;
    let mockPriceFeed;
    let owner;
    let presaleContract;
    let liquidityFund;
    let buyer1;

    beforeEach(async function () {
        [owner, presaleContract, liquidityFund, buyer1] = await ethers.getSigners();
        
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
            [] // Empty stablecoin array for testing
        );

        // Set presale contract
        await vestingVault.setPresaleContract(presaleContract.address);

        // Transfer tokens to vault
        const presaleAllocation = ethers.parseEther("400000000");
        await ndgToken.transfer(vestingVault.target, presaleAllocation);
    });

    describe("Deployment", function () {
        it("Should set correct token address", async function () {
            expect(await vestingVault.ndgToken()).to.equal(ndgToken.target);
        });

        it("Should set correct liquidity fund", async function () {
            expect(await vestingVault.liquidityFund()).to.equal(liquidityFund.address);
        });

        it("Should set correct presale contract", async function () {
            expect(await vestingVault.presaleContract()).to.equal(presaleContract.address);
        });
    });

    describe("Allocation Recording", function () {
        it("Should record allocation from presale contract", async function () {
            const totalTokens = ethers.parseEther("10000");
            const immediateTokens = ethers.parseEther("3000");
            const vestingTokens = ethers.parseEther("7000");

            await vestingVault.connect(presaleContract).recordAllocation(
                buyer1.address,
                totalTokens,
                immediateTokens,
                vestingTokens
            );

            const userInfo = await vestingVault.getUserInfo(buyer1.address);
            expect(userInfo.totalTokens).to.equal(totalTokens);
            expect(userInfo.immediateTokens).to.equal(immediateTokens);
            expect(userInfo.vestingTokens).to.equal(vestingTokens);
        });

        it("Should fail if not called by presale contract", async function () {
            const amount = ethers.parseEther("10000");

            await expect(
                vestingVault.connect(owner).recordAllocation(buyer1.address, amount, amount, 0)
            ).to.be.revertedWith("Only presale");
        });
    });

    describe("TGE and Claims", function () {
        beforeEach(async function () {
            const totalTokens = ethers.parseEther("10000");
            const immediateTokens = ethers.parseEther("3000");
            const vestingTokens = ethers.parseEther("7000");

            await vestingVault.connect(presaleContract).recordAllocation(
                buyer1.address,
                totalTokens,
                immediateTokens,
                vestingTokens
            );
        });

        it("Should enable TGE", async function () {
            const futureTime = (await ethers.provider.getBlock('latest')).timestamp + 86400;
            await vestingVault.enableTGE(futureTime);

            expect(await vestingVault.tgeEnabled()).to.equal(true);
            expect(await vestingVault.tgeTime()).to.equal(futureTime);
        });

        it("Should allow claiming immediate tokens after TGE", async function () {
            const futureTime = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await vestingVault.enableTGE(futureTime);

            await time.increaseTo(futureTime + 10);

            await vestingVault.connect(buyer1).claimImmediate();

            const immediateTokens = ethers.parseEther("3000");
            expect(await ndgToken.balanceOf(buyer1.address)).to.equal(immediateTokens);
        });
    });

    describe("Emergency Withdrawal", function () {
        it("Should allow owner to withdraw tokens", async function () {
            const amount = ethers.parseEther("1000");

            await vestingVault.emergencyWithdraw(ndgToken.target, amount);

            expect(await ndgToken.balanceOf(owner.address)).to.be.gt(0);
        });

        it("Should fail if not called by owner", async function () {
            const amount = ethers.parseEther("1000");

            await expect(
                vestingVault.connect(buyer1).emergencyWithdraw(ndgToken.target, amount)
            ).to.be.reverted;
        });
    });
});