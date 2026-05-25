console.log("✅ NDG Buy Modal loaded");

/* ============================================================
   NetDAG Buy Modal - Real Presale Integration
   - Loads partials/ndg-buy-modal.html automatically
   - BSC Testnet
   - User pays BNB
   - User receives NDG immediately
   - Calls NDGPresaleBNB.buyWithBNB()
   - Includes Disconnect / Change Wallet support
   - Includes referral detection and referral proof logging
============================================================ */

(function () {
  "use strict";

  const MODAL_PARTIAL_PATH = "partials/ndg-buy-modal.html?v=real-buy-005";

  const FALLBACK_CONFIG = {
    CHAIN_ID: 97,
    CHAIN_ID_HEX: "0x61",
    RPC_URL: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    BLOCK_EXPLORER: "https://testnet.bscscan.com",
    NDG_TOKEN_ADDRESS: "0xc0E6b1b7a11DB4d126D009f0F4C19F430bd413d7",
    PRESALE_ADDRESS: "0xAc9E6f29C78E4a3cDdd3bDDC3d58a8A46224B160",
    TOKEN_PRICE_USD: 0.006,
    MIN_BUY_USD: 50
  };

  const PRESALE_ABI = [
    "function buyWithBNB() payable",
    "function previewBuy(uint256 bnbAmount) view returns (uint256 usdValue, uint256 ndgAmount)",
    "function getBNBValueUSD(uint256 bnbAmount) view returns (uint256)",
    "function remainingTokens() view returns (uint256)",
    "function totalSold() view returns (uint256)",
    "function totalRaisedUSD() view returns (uint256)",
    "function saleActive() view returns (bool)",
    "function tokenPriceUSD() view returns (uint256)",
    "function minBuyUSD() view returns (uint256)",
    "function presaleAllocation() view returns (uint256)",
    "function treasury() view returns (address)"
  ];

  const BSC_TESTNET_CONFIG = {
    chainId: "0x61",
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    blockExplorerUrls: ["https://testnet.bscscan.com"]
  };

  const EARLYBIRD_BONUS = {
    bonus30: 0.08,
    bonus60: 0.16,
    bonus90: 0.24
  };

  const REFERRAL_BONUS_PERCENT = 5;
  const REFERRAL_STORAGE_KEY = "netdag_referral_wallet_v1";
  const REFERRAL_API_ENDPOINT = "/api/referral-log";

  let modal = null;
  let modalLoadingPromise = null;
  let activeWalletAddress = null;
  let activeReferralWallet = null;

  let lastPreview = {
    usd: 0,
    ndg: 0,
    bnb: 0
  };

  let livePresaleState = {
    tokenPriceUsd: FALLBACK_CONFIG.TOKEN_PRICE_USD,
    minBuyUsd: FALLBACK_CONFIG.MIN_BUY_USD,
    saleActive: false,
    remaining: 0
  };

  /* ============================================================
     CONFIG
  ============================================================ */

  function getAppConfig() {
    const cfg = window.CONTRACT_CONFIG || {};
    const addresses = cfg.CONTRACT_ADDRESSES || {};

    return {
      chainId: cfg.CHAIN_ID || FALLBACK_CONFIG.CHAIN_ID,
      chainIdHex: cfg.CHAIN_ID_HEX || FALLBACK_CONFIG.CHAIN_ID_HEX,
      rpcUrl: cfg.RPC_URL || FALLBACK_CONFIG.RPC_URL,
      explorer: cfg.BLOCK_EXPLORER || FALLBACK_CONFIG.BLOCK_EXPLORER,

      ndgToken:
        addresses.NDG_TOKEN_ADDRESS ||
        cfg.NDG_TOKEN_ADDRESS ||
        cfg.NDG_TOKEN ||
        FALLBACK_CONFIG.NDG_TOKEN_ADDRESS,

      presale:
        addresses.PRESALE_ADDRESS ||
        cfg.PRESALE_ADDRESS ||
        cfg.PRESALE_CONTRACT ||
        FALLBACK_CONFIG.PRESALE_ADDRESS,

      tokenPriceUsd:
        Number(cfg.PRESALE_SETTINGS?.TOKEN_PRICE_USD || FALLBACK_CONFIG.TOKEN_PRICE_USD),

      minBuyUsd:
        Number(cfg.PRESALE_SETTINGS?.MIN_BUY_USD || FALLBACK_CONFIG.MIN_BUY_USD),

      abi:
        cfg.ABIS?.PRESALE || PRESALE_ABI
    };
  }

  function getEffectiveTokenPriceUsd() {
    return Number(
      livePresaleState.tokenPriceUsd ||
      getAppConfig().tokenPriceUsd ||
      FALLBACK_CONFIG.TOKEN_PRICE_USD
    );
  }

  function getEffectiveMinBuyUsd() {
    return Number(
      livePresaleState.minBuyUsd ||
      getAppConfig().minBuyUsd ||
      FALLBACK_CONFIG.MIN_BUY_USD
    );
  }

  /* ============================================================
     ETHERS COMPATIBILITY
  ============================================================ */

  function getEthers() {
    if (!window.ethers) {
      throw new Error("Ethers.js is not loaded. Check script order.");
    }

    return window.ethers;
  }

  function isEthersV6() {
    return !!window.ethers?.BrowserProvider;
  }

  function parseEtherValue(value) {
    const ethers = getEthers();
    const clean = String(value || "0").trim();

    if (isEthersV6()) {
      return ethers.parseEther(clean);
    }

    return ethers.utils.parseEther(clean);
  }

  function formatUnitsValue(value, decimals) {
    const ethers = getEthers();

    if (isEthersV6()) {
      return ethers.formatUnits(value, decimals);
    }

    return ethers.utils.formatUnits(value, decimals);
  }

  function isValidAddress(address) {
    const value = String(address || "").trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return false;
    }

    try {
      const ethers = getEthers();

      if (isEthersV6()) {
        return ethers.isAddress(value);
      }

      return ethers.utils.isAddress(value);
    } catch (error) {
      return /^0x[a-fA-F0-9]{40}$/.test(value);
    }
  }

  function getBrowserProvider(injectedProvider) {
    const ethers = getEthers();

    if (isEthersV6()) {
      return new ethers.BrowserProvider(injectedProvider);
    }

    return new ethers.providers.Web3Provider(injectedProvider);
  }

  async function getSigner(provider) {
    if (isEthersV6()) {
      return await provider.getSigner();
    }

    return provider.getSigner();
  }

  function makeContract(address, abi, signerOrProvider) {
    const ethers = getEthers();
    return new ethers.Contract(address, abi, signerOrProvider);
  }

  /* ============================================================
     DOM HELPERS
  ============================================================ */

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value;
  }

  function readNumber(id) {
    const el = byId(id);
    if (!el) return NaN;

    const clean = String(el.value || "")
      .replace(/,/g, "")
      .trim();

    if (!clean) return NaN;

    return Number(clean);
  }

  function formatNumber(value, maxDecimals = 2) {
    const n = Number(value);

    if (!Number.isFinite(n)) return "—";

    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
  }

  function formatUSD(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) return "$0.00";

    return `$${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function shortHash(hash) {
    if (!hash) return "—";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  function shortAddress(address) {
    if (!address) return "—";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function bnbNumberToDecimalString(value) {
    const n = Number(value);

    if (!Number.isFinite(n) || n <= 0) return "0";

    return n
      .toFixed(18)
      .replace(/0+$/, "")
      .replace(/\.$/, "");
  }

  function setStatus(message, type = "info") {
    const ids = [
      "ndgBuyStatus",
      "buyStatus",
      "ndgStatus",
      "presaleStatus"
    ];

    ids.forEach((id) => {
      const el = byId(id);
      if (!el) return;

      el.textContent = message;
      el.dataset.status = type;
      el.classList.remove("is-error", "is-success", "is-info", "is-warning");
      el.classList.add(`is-${type}`);
    });

    if (message) console.log(`[NDG Buy][${type}] ${message}`);
  }

  function setBusy(isBusy) {
    const buttons = [
      byId("ndgBuyAction"),
      byId("btn-purchase"),
      byId("buyNDGAction"),
      byId("ndgConfirmBuy")
    ].filter(Boolean);

    buttons.forEach((btn) => {
      btn.disabled = !!isBusy;

      if (isBusy) {
        if (!btn.dataset.oldText) {
          btn.dataset.oldText = btn.textContent;
        }
        btn.textContent = "Processing...";
      } else if (btn.dataset.oldText) {
        btn.textContent = btn.dataset.oldText;
        delete btn.dataset.oldText;
      }
    });
  }

  function findBuyButton() {
    return (
      byId("ndgBuyAction") ||
      byId("btn-purchase") ||
      byId("buyNDGAction") ||
      byId("ndgConfirmBuy") ||
      document.querySelector("#ndgBuyModal .ndg-buy-btn")
    );
  }

  function findConnectButton() {
    return (
      byId("ndgConnectWallet") ||
      byId("connect-wallet") ||
      byId("connectWallet") ||
      byId("btn-connect-wallet")
    );
  }

  function findDisconnectButton() {
    return (
      byId("ndgDisconnectWallet") ||
      byId("ndgChangeWallet") ||
      document.querySelector("[data-ndg-disconnect-wallet]")
    );
  }

  function ensureDisconnectButton() {
    let disconnectBtn = findDisconnectButton();

    if (disconnectBtn) return disconnectBtn;

    const connectBtn = findConnectButton();
    if (!connectBtn || !connectBtn.parentNode) return null;

    disconnectBtn = document.createElement("button");
    disconnectBtn.id = "ndgDisconnectWallet";
    disconnectBtn.type = "button";
    disconnectBtn.className = "ndg-disconnect-wallet";
    disconnectBtn.setAttribute("data-ndg-disconnect-wallet", "");
    disconnectBtn.textContent = "Disconnect / Change Wallet";

    disconnectBtn.style.display = "none";
    disconnectBtn.style.marginTop = "8px";
    disconnectBtn.style.cursor = "pointer";

    connectBtn.insertAdjacentElement("afterend", disconnectBtn);

    return disconnectBtn;
  }

  function updateWalletButtons() {
    const connectBtn = findConnectButton();
    const disconnectBtn = ensureDisconnectButton();
    const buyButton = findBuyButton();

    if (connectBtn) {
      connectBtn.textContent = "Connect Wallet";
      connectBtn.disabled = false;

      if (activeWalletAddress) {
        connectBtn.style.setProperty("display", "none", "important");
      } else {
        connectBtn.style.setProperty("display", "inline-flex", "important");
      }
    }

    if (disconnectBtn) {
      disconnectBtn.textContent = "Disconnect / Change Wallet";

      if (activeWalletAddress) {
        disconnectBtn.style.setProperty("display", "inline-flex", "important");
      } else {
        disconnectBtn.style.setProperty("display", "none", "important");
      }
    }

    if (buyButton) {
      buyButton.disabled = !activeWalletAddress;

      if (activeWalletAddress) {
        buyButton.style.removeProperty("opacity");
        buyButton.style.removeProperty("cursor");
        buyButton.style.removeProperty("filter");
      } else {
        buyButton.style.setProperty("opacity", "0.55", "important");
        buyButton.style.setProperty("cursor", "not-allowed", "important");
        buyButton.style.setProperty("filter", "grayscale(0.35)", "important");
      }
    }
  }

  function updateWalletText(address) {
    activeWalletAddress = address || null;

    const short = address
      ? shortAddress(address)
      : "Not connected";

    setText("ndgWalletAddress", short);
    setText("wallet-address", short);
    setText("connectedWallet", short);

    updateWalletButtons();
    renderReferralNotice();
  }

  /* ============================================================
     REFERRAL TRACKING
  ============================================================ */

  function getUrlReferralWallet() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("ref") || params.get("referrer") || "";
    } catch (error) {
      return "";
    }
  }

  function loadStoredReferralWallet() {
    try {
      return localStorage.getItem(REFERRAL_STORAGE_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function storeReferralWallet(address) {
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, address);
    } catch (error) {
      console.warn("Could not store referral wallet:", error);
    }
  }

  function clearReferralWallet() {
    try {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
    } catch (error) {
      console.warn("Could not clear referral wallet:", error);
    }
  }

  function getActiveReferralWallet() {
    return activeReferralWallet || loadStoredReferralWallet() || "";
  }

  function initReferralTracking() {
    const refFromUrl = getUrlReferralWallet();
    const storedRef = loadStoredReferralWallet();

    if (refFromUrl) {
      if (isValidAddress(refFromUrl)) {
        activeReferralWallet = refFromUrl;
        storeReferralWallet(refFromUrl);
        console.log("[NDG Referral] Referral detected from URL:", refFromUrl);
      } else {
        console.warn("[NDG Referral] Invalid referral wallet ignored:", refFromUrl);
        activeReferralWallet = storedRef && isValidAddress(storedRef) ? storedRef : null;
      }
    } else if (storedRef && isValidAddress(storedRef)) {
      activeReferralWallet = storedRef;
      console.log("[NDG Referral] Stored referral loaded:", storedRef);
    } else {
      activeReferralWallet = null;
    }

    renderReferralNotice();
  }

  function ensureReferralNotice() {
    const m = getModal();
    if (!m) return null;

    let box = byId("ndgReferralNotice");

    if (box) return box;

    box = document.createElement("div");
    box.id = "ndgReferralNotice";
    box.className = "ndg-referral-notice";
    box.style.display = "none";
    box.style.margin = "10px 0";
    box.style.padding = "10px 12px";
    box.style.border = "1px solid rgba(255,153,0,0.45)";
    box.style.borderRadius = "12px";
    box.style.background = "rgba(255,153,0,0.08)";
    box.style.color = "#fff";
    box.style.fontSize = "0.9rem";
    box.style.lineHeight = "1.35";

    const form = byId("ndgBuyForm") || m.querySelector("form") || m.querySelector(".ndg-modal-card");

    if (!form) return null;

    const usdInput = byId("ndgUsdInput");
    const fieldWrapper = usdInput?.closest(".ndg-field") || usdInput?.parentNode;

    if (fieldWrapper && fieldWrapper.parentNode) {
      fieldWrapper.parentNode.insertBefore(box, fieldWrapper);
    } else {
      form.insertBefore(box, form.firstChild);
    }

    return box;
  }

  function renderReferralNotice() {
    const box = ensureReferralNotice();
    if (!box) return;

    const ref = getActiveReferralWallet();

    if (!ref || !isValidAddress(ref)) {
      box.style.display = "none";
      box.textContent = "";
      return;
    }

    if (activeWalletAddress && ref.toLowerCase() === activeWalletAddress.toLowerCase()) {
      box.style.display = "block";
      box.innerHTML = `
        <strong>Referral ignored:</strong>
        You cannot refer yourself with the same wallet.
      `;
      return;
    }

    box.style.display = "block";
    box.innerHTML = `
     <strong>5% referral bonus detected</strong>
     <span>${shortAddress(ref)}</span>
    `;
  }

  function getReferralSourcePage() {
    try {
      return window.location.href;
    } catch (error) {
      return "unknown";
    }
  }

  async function logReferralAfterSuccessfulPurchase({ txHash, usd, ndg, bnb }) {
    const referrerWallet = getActiveReferralWallet();

    if (!referrerWallet || !isValidAddress(referrerWallet)) {
      console.log("[NDG Referral] No valid referral wallet. Skipping referral log.");
      return {
        skipped: true,
        reason: "No valid referral wallet"
      };
    }

    if (!activeWalletAddress || !isValidAddress(activeWalletAddress)) {
      console.warn("[NDG Referral] Buyer wallet missing. Skipping referral log.");
      return {
        skipped: true,
        reason: "Buyer wallet missing"
      };
    }

    if (referrerWallet.toLowerCase() === activeWalletAddress.toLowerCase()) {
      console.warn("[NDG Referral] Referrer and buyer are the same. Skipping referral log.");
      setStatus("Purchase successful. Referral ignored because buyer and referrer are the same wallet.", "warning");
      return {
        skipped: true,
        reason: "Self-referral"
      };
    }

    const cfg = getAppConfig();

    const payload = {
      referrerWallet,
      buyerWallet: activeWalletAddress,
      transactionHash: txHash,
      presaleContract: cfg.presale,
      usdAmount: Number(usd || 0),
      bnbPaid: Number(bnb || 0),
      ndgBought: Number(ndg || 0),
      sourcePage: getReferralSourcePage()
    };

    try {
      console.log("[NDG Referral] Sending referral proof:", payload);

      const response = await fetch(REFERRAL_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Referral log request failed.");
      }

      console.log("[NDG Referral] Referral logged:", data);

      setStatus(
        `Purchase successful. Referral logged for manual review: ${formatNumber(data.referralBonusNDG, 2)} NDG bonus.`,
        "success"
      );

      return data;
    } catch (error) {
      console.error("[NDG Referral] Referral logging failed:", error);

      setStatus(
        "Purchase successful. Referral logging failed, but the NDG purchase was completed.",
        "warning"
      );

      return {
        ok: false,
        error: error.message || "Referral logging failed"
      };
    }
  }

  /* ============================================================
     MODAL LOADER
  ============================================================ */

  function getModal() {
    if (!modal) {
      modal = byId("ndgBuyModal");
    }

    return modal;
  }

  async function ensureModalLoaded() {
    const existing = getModal();

    if (existing) {
      bindModalOnce();
      bindBuyEngine();
      initReferralTracking();
      return existing;
    }

    if (modalLoadingPromise) {
      return modalLoadingPromise;
    }

    modalLoadingPromise = fetch(MODAL_PARTIAL_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${MODAL_PARTIAL_PATH}`);
        }

        return response.text();
      })
      .then((html) => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        const loadedModal = wrapper.querySelector("#ndgBuyModal");

        if (!loadedModal) {
          throw new Error("ndgBuyModal was not found inside partial file.");
        }

        document.body.appendChild(loadedModal);
        modal = loadedModal;

        bindModalOnce();
        bindBuyEngine();
        initReferralTracking();

        return loadedModal;
      })
      .catch((error) => {
        console.error("Failed to load NDG Buy modal:", error);
        setStatus("Buy modal could not be loaded.", "error");
        throw error;
      });

    return modalLoadingPromise;
  }

  async function openModal() {
    try {
      const m = await ensureModalLoaded();

      m.style.display = "";
      m.classList.add("is-open");
      m.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      initReferralTracking();
      await refreshWalletFromExistingConnection();
      await refreshPresaleInfo();
      calculateFromInputs();
      renderReferralNotice();
    } catch (error) {
      console.error(error);
      alert("Buy modal could not be loaded. Please refresh and try again.");
    }
  }

  function closeModal() {
    const m = getModal();
    if (!m) return;

    m.setAttribute("aria-hidden", "true");
    m.classList.remove("is-open", "open", "active");
    document.body.style.overflow = "";
  }

  function bindModalOnce() {
    const m = getModal();
    if (!m || m.__ndgBound) return;

    m.__ndgBound = true;

    m.querySelectorAll("[data-ndg-close], #ndgBuyModalClose, .ndg-modal-close").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    });

    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.hasAttribute("data-ndg-close")) {
        e.preventDefault();
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  window.NDG_OPEN_BUY_MODAL = openModal;
  window.NDG_CLOSE_BUY_MODAL = closeModal;
  window.NDG_BIND_BUY_MODAL = function () {
    ensureModalLoaded().catch(console.error);
  };

  window.NDG_CLEAR_REFERRAL = function () {
    activeReferralWallet = null;
    clearReferralWallet();
    renderReferralNotice();
    console.log("[NDG Referral] Referral cleared.");
  };

  /* ============================================================
     WALLET
  ============================================================ */

  function getInjectedProvider() {
    if (window.WalletConnect && typeof window.WalletConnect.getProvider === "function") {
      const existing = window.WalletConnect.getProvider();
      if (existing) return existing;
    }

    if (window.ethereum?.providers?.length) {
      const mm = window.ethereum.providers.find((p) => p.isMetaMask);
      if (mm) return mm;
    }

    return window.ethereum || null;
  }

  async function ensureBscTestnet(injectedProvider) {
    const cfg = getAppConfig();

    const chainId = await injectedProvider.request({
      method: "eth_chainId"
    });

    if (String(chainId).toLowerCase() === String(cfg.chainIdHex).toLowerCase()) {
      return true;
    }

    try {
      await injectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: cfg.chainIdHex }]
      });

      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        await injectedProvider.request({
          method: "wallet_addEthereumChain",
          params: [BSC_TESTNET_CONFIG]
        });

        return true;
      }

      throw new Error("Please switch your wallet to BNB Smart Chain Testnet.");
    }
  }

  async function revokeWalletPermissions(injectedProvider) {
    if (!injectedProvider || typeof injectedProvider.request !== "function") {
      return false;
    }

    try {
      await injectedProvider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }]
      });

      return true;
    } catch (error) {
      console.warn("Wallet permission revoke was not completed or not supported:", error);
      return false;
    }
  }

  async function requestWalletConnection() {
    const injected = getInjectedProvider();

    if (!injected) {
      throw new Error("No wallet found. Please install MetaMask or use a Web3 wallet.");
    }

    await ensureBscTestnet(injected);

    const accounts = await injected.request({
      method: "eth_requestAccounts"
    });

    if (!accounts || !accounts.length) {
      throw new Error("No wallet account returned.");
    }

    activeWalletAddress = accounts[0];
    updateWalletText(activeWalletAddress);

    return {
      injected,
      address: activeWalletAddress
    };
  }

  async function refreshWalletFromExistingConnection() {
    try {
      const injected = getInjectedProvider();

      if (!injected) {
        updateWalletText(null);
        return null;
      }

      const accounts = await injected.request({
        method: "eth_accounts"
      });

      if (accounts && accounts.length) {
        activeWalletAddress = accounts[0];
        updateWalletText(activeWalletAddress);
        return activeWalletAddress;
      }

      updateWalletText(null);
      return null;
    } catch (error) {
      console.warn("Could not refresh wallet:", error);
      updateWalletText(null);
      return null;
    }
  }

  async function handleDisconnectClick(e) {
    if (e) e.preventDefault();

    const injected = getInjectedProvider();

    setStatus("Disconnecting wallet...", "info");

    await revokeWalletPermissions(injected);

    activeWalletAddress = null;
    updateWalletText(null);

    setStatus("Wallet disconnected. Click Connect Wallet to choose another account.", "success");
  }

  async function handleConnectClick(e) {
    if (e) e.preventDefault();

    try {
      const injected = getInjectedProvider();

      if (activeWalletAddress && injected) {
        setStatus("Preparing wallet switch...", "info");
        await revokeWalletPermissions(injected);
        updateWalletText(null);
      }

      setStatus("Connecting wallet...", "info");

      const { address } = await requestWalletConnection();

      updateWalletText(address);
      setStatus("Wallet connected.", "success");

      window.dispatchEvent(
        new CustomEvent("walletConnected", {
          detail: { address }
        })
      );
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Wallet connection failed.", "error");
    }
  }

  /* ============================================================
     CONTRACTS
  ============================================================ */

  async function getPresaleReadContract() {
    const cfg = getAppConfig();

    if (!cfg.presale || !isValidAddress(cfg.presale)) {
      throw new Error("Invalid presale contract address.");
    }

    const ethers = getEthers();
    let provider;

    if (isEthersV6()) {
      provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    } else {
      provider = new ethers.providers.JsonRpcProvider(cfg.rpcUrl);
    }

    return makeContract(cfg.presale, cfg.abi, provider);
  }

  async function getPresaleWriteContract() {
    const cfg = getAppConfig();

    if (!cfg.presale || !isValidAddress(cfg.presale)) {
      throw new Error("Invalid presale contract address.");
    }

    const connection = await requestWalletConnection();
    const browserProvider = getBrowserProvider(connection.injected);
    const signer = await getSigner(browserProvider);

    return makeContract(cfg.presale, cfg.abi, signer);
  }

  async function getOneBnbUsdValue() {
    const presale = await getPresaleReadContract();
    const oneBnb = parseEtherValue("1");
    const usdValue = await presale.getBNBValueUSD(oneBnb);

    return Number(formatUnitsValue(usdValue, 18));
  }

  async function getBnbNeededForUsd(usdAmount) {
    const oneBnbUsd = await getOneBnbUsdValue();

    if (!oneBnbUsd || !Number.isFinite(oneBnbUsd) || oneBnbUsd <= 0) {
      throw new Error("Could not read BNB price.");
    }

    return Number(usdAmount) / oneBnbUsd;
  }

  async function previewByBnbAmount(bnbAmount) {
    const presale = await getPresaleReadContract();
    const bnbWei = parseEtherValue(bnbNumberToDecimalString(bnbAmount));
    const result = await presale.previewBuy(bnbWei);

    const usdValue = result.usdValue !== undefined ? result.usdValue : result[0];
    const ndgAmount = result.ndgAmount !== undefined ? result.ndgAmount : result[1];

    return {
      usd: Number(formatUnitsValue(usdValue, 18)),
      ndg: Number(formatUnitsValue(ndgAmount, 18)),
      bnb: Number(bnbAmount)
    };
  }

  async function refreshPresaleInfo() {
    try {
      const cfg = getAppConfig();
      const presale = await getPresaleReadContract();

      const active = await presale.saleActive();
      const tokenPrice = await presale.tokenPriceUSD();
      const minBuy = await presale.minBuyUSD();
      const remaining = await presale.remainingTokens();

      const priceNumber = Number(formatUnitsValue(tokenPrice, 18));
      const minNumber = Number(formatUnitsValue(minBuy, 18));
      const remainingNumber = Number(formatUnitsValue(remaining, 18));

      livePresaleState = {
        tokenPriceUsd: priceNumber || cfg.tokenPriceUsd,
        minBuyUsd: minNumber || cfg.minBuyUsd,
        saleActive: !!active,
        remaining: remainingNumber
      };

      setText("ndgTokenPrice", `$${livePresaleState.tokenPriceUsd.toFixed(3)}`);
      setText("ndgMinBuy", `$${livePresaleState.minBuyUsd.toFixed(2)}`);
      setText("ndgRemainingTokens", formatNumber(livePresaleState.remaining, 0));

      if (!active) {
        setStatus("Presale is not active yet.", "warning");
      } else {
        setStatus("Presale is active on BSC Testnet.", "success");
      }

      return livePresaleState;
    } catch (error) {
      console.warn("Could not refresh presale info:", error);
      setStatus("Presale info could not be refreshed. Check console if this continues.", "warning");
      return null;
    }
  }

  /* ============================================================
     CALCULATIONS
  ============================================================ */

  function renderEstimate(ndg, usd, bnb) {
    lastPreview = {
      ndg: Number(ndg) || 0,
      usd: Number(usd) || 0,
      bnb: Number(bnb) || 0
    };

    setText("ndgTokensOut", formatNumber(lastPreview.ndg, 2));
    setText("ndgCostOut", formatNumber(lastPreview.usd, 2));
    setText("ndgBnbOut", formatNumber(lastPreview.bnb, 6));
    setText("ndgUsdOut", formatUSD(lastPreview.usd));

    setText("receive-amount", formatNumber(lastPreview.ndg, 2));
    setText("usd-value", lastPreview.usd.toFixed(2));

    setText("ndgBonus30", formatNumber(lastPreview.ndg * EARLYBIRD_BONUS.bonus30, 2));
    setText("ndgBonus60", formatNumber(lastPreview.ndg * EARLYBIRD_BONUS.bonus60, 2));
    setText("ndgBonus90", formatNumber(lastPreview.ndg * EARLYBIRD_BONUS.bonus90, 2));
  }

  function renderEmptyEstimate() {
    renderEstimate(0, 0, 0);
  }

  async function calculateFromUsd() {
    const usd = readNumber("ndgUsdInput");

    if (!Number.isFinite(usd) || usd <= 0) {
      renderEmptyEstimate();
      return;
    }

    const price = getEffectiveTokenPriceUsd();
    const minBuy = getEffectiveMinBuyUsd();
    const estimatedNdg = usd / price;

    try {
      const bnbNeeded = await getBnbNeededForUsd(usd);
      const preview = await previewByBnbAmount(bnbNeeded);

      renderEstimate(preview.ndg, preview.usd, preview.bnb);

      if (usd < minBuy) {
        setStatus(`Minimum buy is $${minBuy}.`, "warning");
      } else {
        setStatus("Ready to buy with BNB.", "success");
      }
    } catch (error) {
      const fallbackBnb = usd / 650;
      renderEstimate(estimatedNdg, usd, fallbackBnb);
      setStatus("Using local estimate. Contract preview not available yet.", "warning");
    }
  }

  async function calculateFromNdg() {
    const ndg = readNumber("ndgNdgInput");

    if (!Number.isFinite(ndg) || ndg <= 0) {
      renderEmptyEstimate();
      return;
    }

    const price = getEffectiveTokenPriceUsd();
    const minBuy = getEffectiveMinBuyUsd();
    const usd = ndg * price;

    try {
      const bnbNeeded = await getBnbNeededForUsd(usd);
      const preview = await previewByBnbAmount(bnbNeeded);

      renderEstimate(preview.ndg, preview.usd, preview.bnb);

      if (usd < minBuy) {
        setStatus(`Minimum buy is $${minBuy}.`, "warning");
      } else {
        setStatus("Ready to buy with BNB.", "success");
      }
    } catch (error) {
      const fallbackBnb = usd / 650;
      renderEstimate(ndg, usd, fallbackBnb);
      setStatus("Using local estimate. Contract preview not available yet.", "warning");
    }
  }

  function calculateFromInputs() {
    const usdInput = byId("ndgUsdInput");
    const ndgInput = byId("ndgNdgInput");

    if (usdInput && usdInput.value) {
      calculateFromUsd();
      return;
    }

    if (ndgInput && ndgInput.value) {
      calculateFromNdg();
      return;
    }

    renderEmptyEstimate();
  }

  /* ============================================================
     BUY FLOW
  ============================================================ */

  async function executeBuy(e) {
    if (e) e.preventDefault();

    try {
      setBusy(true);
      setStatus("Preparing purchase...", "info");

      let usd = readNumber("ndgUsdInput");
      const ndg = readNumber("ndgNdgInput");

      const price = getEffectiveTokenPriceUsd();
      const minBuy = getEffectiveMinBuyUsd();

      if ((!Number.isFinite(usd) || usd <= 0) && Number.isFinite(ndg) && ndg > 0) {
        usd = ndg * price;
      }

      if (!Number.isFinite(usd) || usd <= 0) {
        throw new Error("Enter a valid USD or NDG amount first.");
      }

      if (usd < minBuy) {
        throw new Error(`Minimum buy is $${minBuy}.`);
      }

      setStatus("Calculating required BNB...", "info");

      const bnbNeeded = await getBnbNeededForUsd(usd);
      const preview = await previewByBnbAmount(bnbNeeded);

      if (preview.usd < minBuy) {
        throw new Error(`Minimum buy is $${minBuy}.`);
      }

      renderEstimate(preview.ndg, preview.usd, preview.bnb);

      const contract = await getPresaleWriteContract();

      setStatus("Open MetaMask and confirm the transaction...", "info");

      const tx = await contract.buyWithBNB({
        value: parseEtherValue(bnbNumberToDecimalString(preview.bnb))
      });

      setStatus("Transaction submitted. Waiting for confirmation...", "info");

      const receipt = await tx.wait();
      const txHash = receipt.hash || receipt.transactionHash || tx.hash;

      setStatus("Purchase successful. NDG received in your wallet.", "success");

      setText("ndgLastTxHash", shortHash(txHash));
      setText("tx-hash", shortHash(txHash));

      const cfg = getAppConfig();
      const link = `${cfg.explorer}/tx/${txHash}`;

      const linkEls = [
        byId("ndgBscscanLink"),
        byId("view-bscscan")
      ].filter(Boolean);

      linkEls.forEach((a) => {
        a.href = link;
        a.target = "_blank";
        a.rel = "noopener";
      });

      window.dispatchEvent(
        new CustomEvent("ndgPurchaseSuccess", {
          detail: {
            txHash,
            usd: preview.usd,
            ndg: preview.ndg,
            bnb: preview.bnb,
            referralWallet: getActiveReferralWallet() || null
          }
        })
      );

      await logReferralAfterSuccessfulPurchase({
        txHash,
        usd: preview.usd,
        ndg: preview.ndg,
        bnb: preview.bnb
      });

      await refreshPresaleInfo();
    } catch (error) {
      console.error("NDG buy failed:", error);

      let message = error.message || "Purchase failed.";

      if (message.includes("user rejected") || message.includes("User denied")) {
        message = "Transaction rejected in wallet.";
      }

      if (message.includes("insufficient funds")) {
        message = "Insufficient BNB for purchase and gas.";
      }

      if (message.includes("Sale not active")) {
        message = "Presale is not active.";
      }

      if (message.includes("Below minimum")) {
        message = "Below minimum buy amount.";
      }

      setStatus(message, "error");
    } finally {
      setBusy(false);
    }
  }

  /* ============================================================
     BINDING
  ============================================================ */

  function bindBuyEngine() {
    const usdInput = byId("ndgUsdInput");
    const ndgInput = byId("ndgNdgInput");

    if (usdInput && !usdInput.__ndgRealBuyBound) {
      usdInput.__ndgRealBuyBound = true;
      usdInput.addEventListener("input", calculateFromUsd);
      usdInput.addEventListener("blur", calculateFromUsd);
    }

    if (ndgInput && !ndgInput.__ndgRealBuyBound) {
      ndgInput.__ndgRealBuyBound = true;
      ndgInput.addEventListener("input", calculateFromNdg);
      ndgInput.addEventListener("blur", calculateFromNdg);
    }

    const buyButton = findBuyButton();
    if (buyButton && !buyButton.__ndgRealBuyBound) {
      buyButton.__ndgRealBuyBound = true;
      buyButton.addEventListener("click", executeBuy);
    }

    const connectButton = findConnectButton();
    if (connectButton && !connectButton.__ndgRealConnectBound) {
      connectButton.__ndgRealConnectBound = true;
      connectButton.addEventListener("click", handleConnectClick);
    }

    const disconnectButton = ensureDisconnectButton();
    if (disconnectButton && !disconnectButton.__ndgRealDisconnectBound) {
      disconnectButton.__ndgRealDisconnectBound = true;
      disconnectButton.addEventListener("click", handleDisconnectClick);
    }

    updateWalletButtons();
    initReferralTracking();

    document
      .querySelectorAll("[data-open-presale], [data-open-buy], [data-ndg-buy-open], [data-ndg-open]")
      .forEach((btn) => {
        if (btn.__ndgOpenBound) return;
        btn.__ndgOpenBound = true;

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          openModal();
        });
      });

    const legacyBtn = byId("navBuyNdg");
    if (legacyBtn && !legacyBtn.__ndgOpenBound) {
      legacyBtn.__ndgOpenBound = true;
      legacyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    }

    return true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    initReferralTracking();
    bindBuyEngine();
    refreshWalletFromExistingConnection();
  });

  window.addEventListener("walletConnected", () => {
    refreshWalletFromExistingConnection();
  });

  if (window.ethereum) {
    window.ethereum.on?.("accountsChanged", (accounts) => {
      if (accounts && accounts.length) {
        updateWalletText(accounts[0]);
      } else {
        updateWalletText(null);
      }
    });

    window.ethereum.on?.("chainChanged", () => {
      window.location.reload();
    });
  }
})();