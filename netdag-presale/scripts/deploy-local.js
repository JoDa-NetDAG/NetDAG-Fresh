const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const Presale = await hre.ethers.getContractFactory("Presale");
  // If Presale has constructor arguments, pass them inside deploy(...)
  const presale = await Presale.deploy();

  await presale.deployed();
  console.log("Presale deployed to:", presale.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });