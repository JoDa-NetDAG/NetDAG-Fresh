const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy NDG token (1,000,000,000) - or replace this part to reuse an existing token
  const NDG = await ethers.getContractFactory("NDGToken");
  const initialSupply = ethers.utils.parseUnits("1000000000", 18);
  const ndg = await NDG.deploy(initialSupply);
  await ndg.deployed();
  console.log("NDG deployed:", ndg.address);

  // Oracle: use CHAINLINK_ORACLE env if set; otherwise deploy a mock
  let aggAddress;
  if (process.env.CHAINLINK_ORACLE && process.env.CHAINLINK_ORACLE !== "") {
    aggAddress = process.env.CHAINLINK_ORACLE;
    console.log("Using provided Chainlink oracle:", aggAddress);
  } else {
    const MockAgg = await ethers.getContractFactory("MockV3Aggregator");
    const mockAgg = await MockAgg.deploy(8, ethers.BigNumber.from("60000000000"));
    await mockAgg.deployed();
    aggAddress = mockAgg.address;
    console.log("Deployed mock aggregator:", aggAddress);
  }

  // Deploy Presale
  const Presale = await ethers.getContractFactory("Presale");
  const minUsd18 = ethers.utils.parseUnits("50", 18);
  const maxUsd18 = ethers.utils.parseUnits("50000", 18);
  const presale = await Presale.deploy(ndg.address, aggAddress, minUsd18, maxUsd18);
  await presale.deployed();
  console.log("Presale deployed:", presale.address);

  // Add tiers
  const price1 = ethers.utils.parseUnits("0.025", 18);
  const cap1 = ethers.utils.parseUnits("500000", 18);
  const price2 = ethers.utils.parseUnits("0.03", 18);
  const cap2 = ethers.utils.parseUnits("500000", 18);

  await presale.addTier(price1, cap1);
  await presale.addTier(price2, cap2);
  console.log("Tiers added.");

  // Fund presale: transfer NDG from deployer to presale
  const allocation = ethers.utils.parseUnits("40000000", 18);
  await ndg.transfer(presale.address, allocation);
  console.log("Transferred NDG to presale:", allocation.toString());

  console.log("DONE. Update frontend with presale address:", presale.address);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });