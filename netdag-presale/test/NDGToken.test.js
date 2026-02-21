const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NDGToken", function () {
    let ndgToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        const NDGToken = await ethers.getContractFactory("NDGToken");
        const initialSupply = ethers.parseEther("1000000000"); // 1 billion tokens
        ndgToken = await NDGToken.deploy(initialSupply);
    });

    describe("Deployment", function () {
        it("Should set the right name and symbol", async function () {
            expect(await ndgToken.name()).to.equal("NetDAG");
            expect(await ndgToken.symbol()).to.equal("NDG");
        });

        it("Should have 18 decimals", async function () {
            expect(await ndgToken.decimals()).to.equal(18);
        });

        it("Should mint 1 billion tokens to owner", async function () {
            const expectedSupply = ethers.parseEther("1000000000");
            expect(await ndgToken.totalSupply()).to.equal(expectedSupply);
            expect(await ndgToken.balanceOf(owner.address)).to.equal(expectedSupply);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("100");

            await ndgToken.transfer(addr1.address, amount);
            expect(await ndgToken.balanceOf(addr1.address)).to.equal(amount);

            await ndgToken.connect(addr1).transfer(addr2.address, amount);
            expect(await ndgToken.balanceOf(addr2.address)).to.equal(amount);
            expect(await ndgToken.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await ndgToken.balanceOf(owner.address);

            await expect(
                ndgToken.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
            expect(await ndgToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });
    });

    describe("Allowances", function () {
        it("Should approve and transferFrom", async function () {
            const amount = ethers.parseEther("100");

            await ndgToken.approve(addr1.address, amount);
            expect(await ndgToken.allowance(owner.address, addr1.address)).to.equal(amount);

            await ndgToken.connect(addr1).transferFrom(owner.address, addr2.address, amount);
            expect(await ndgToken.balanceOf(addr2.address)).to.equal(amount);
        });
    });
});