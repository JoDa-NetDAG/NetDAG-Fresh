document.addEventListener("DOMContentLoaded", function() {
  // Function to handle showing the referral link
  function onWalletConnected(address) {
    const refSection = document.getElementById("referral-section");
    const refInput = document.getElementById("referral-link");
    const copyBtn = document.getElementById("copy-referral-btn");
    const copiedMsg = document.getElementById("refCopiedMsg");

    // Set referral link
    const cleanAddr = address || "";
    refInput.value = cleanAddr ? `https://netdag.com/?ref=${cleanAddr}` : "";
    refSection.style.display = cleanAddr ? "" : "none";

    // Set up copy button
    copyBtn.onclick = function() {
      refInput.select();
      refInput.setSelectionRange(0, 99999); // For mobile devices
      document.execCommand("copy");
      copiedMsg.style.display = "inline";
      setTimeout(() => { copiedMsg.style.display = "none"; }, 1200);
    };
  }

  // Hook up with wallet connection events
  if(window.connectedWalletAddress){
    onWalletConnected(window.connectedWalletAddress);
  }

  // Listen for wallet connection event
  window.addEventListener("walletConnected", function(e){
    onWalletConnected(e.detail.address);
  });

  // You can also manually call onWalletConnected(address) after connecting a wallet from your wallet connect logic.
});