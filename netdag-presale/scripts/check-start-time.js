const hre = require("hardhat");

async function main() {
  const presaleAddress = "0x72DA63be282a57d207407c7c795D16961bB3e25a";
  
  console.log("🔍 CHECKING PRESALE START TIME...\n");
  
  const presale = await ethers.getContractAt("PresaleWithVesting", presaleAddress);
  
  try {
    const startTime = await presale.presaleStartTime();
    console.log("⏰ Presale Start Time:", startTime.toString());
    console.log("📅 Date:", new Date(startTime * 1000).toLocaleString());
    
    const now = Math.floor(Date.now() / 1000);
    console.log("\n🕐 Current Time:", now);
    console.log("📅 Date:", new Date(now * 1000).toLocaleString());
    
    if (startTime > now) {
      console.log("\n❌ Presale hasn't started yet!");
      console.log("⏳ Starts in:", Math.floor((startTime - now) / 60), "minutes");
    } else {
      console.log("\n✅ Presale has started!");
    }
  } catch (e) {
    console.log("❌ Error:", e.message);
  }
}

main().catch(console.error);