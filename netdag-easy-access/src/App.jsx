/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

const STARTER_BALANCE = 1000;
const NDG_PRICE_USD = 0.006;
const MIN_BUY_USD = 50;
const STAKE_REWARD_RATE = 0.12;

function loadProvenanceProducts() {
  try {
    const records =
      JSON.parse(localStorage.getItem("netdag_provenance_records_v1")) || [];

    const realRecords = records
      .filter((record) => record?.recordId)
      .map((record) => ({
        name: record.productName || record.product || "Verified Product",
        recordId: record.recordId,
        status:
          record.integrityStatus === "tampered"
            ? "Possible Tampering Detected"
            : "Authenticity Confirmed",
        guardian:
          record.integrityStatus === "tampered" ? "NOT CONFIRMED" : "STRONG",
      }));

    return realRecords.length > 0 ? realRecords : [];
  } catch {
    return [];
  }
}

function shortAddress(address) {
  if (!address) return "Creating wallet...";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function makeAccountId(user) {
  const raw =
    user?.id ||
    user?.email?.address ||
    user?.google?.email ||
    "NETDAG-EASY-ACCESS";

  let hash = 0;

  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `NDG-USER-${Math.abs(hash).toString(36).slice(0, 6).toUpperCase()}`;
}

function getUserEmail(user) {
  return (
    user?.email?.address ||
    user?.google?.email ||
    user?.linkedAccounts?.find((item) => item.type === "email")?.address ||
    "Authenticated User"
  );
}

function getStorageKey(accountId) {
  return `netdag_easy_access_${accountId}`;
}

function createFreshAccount(accountId, userEmail, walletAddress) {
  return {
    accountId,
    userEmail,
    walletAddress,
    ndgBalance: STARTER_BALANCE,
    bnbBalance: 0,
    stakedBalance: 0,
    activity: [
      {
        title: "Easy Access account created",
        detail: "1000 NDG starter balance assigned. Gas Fee: 0.",
        time: new Date().toISOString(),
      },
    ],
  };
}

function formatTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function App() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const primaryWallet = wallets?.[0];
  const walletAddress = primaryWallet?.address || "";
  const userEmail = getUserEmail(user);
  const accountId = useMemo(() => makeAccountId(user), [user]);

  const [account, setAccount] = useState(null);
  const [recipient, setRecipient] = useState("NDG-USER-TEST01");
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");

  const [buyOpen, setBuyOpen] = useState(false);
  const [buyUsd, setBuyUsd] = useState(50);

  const [stakeOpen, setStakeOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(0);

  const provenanceProducts = useMemo(() => loadProvenanceProducts(), []);
  const activeProduct =
    provenanceProducts[selectedProduct] || provenanceProducts[0] || null;

  const [stakeAmount, setStakeAmount] = useState(100);
  const [stakeLockPeriod, setStakeLockPeriod] = useState("30");

  const availableNdg = Number((account?.ndgBalance || 0).toFixed(2));
  const stakedNdg = Number((account?.stakedBalance || 0).toFixed(2));
  const totalNdgBalance = Number((availableNdg + stakedNdg).toFixed(2));
  const accountValue = Number((totalNdgBalance * NDG_PRICE_USD).toFixed(2));

  const buyReceiveAmount = Number(
    (Number(buyUsd || 0) / NDG_PRICE_USD).toFixed(2)
  );

  const estimatedStakeReward = Number(
    (
      Number(stakeAmount || 0) *
      STAKE_REWARD_RATE *
      (Number(stakeLockPeriod || 30) / 365)
    ).toFixed(2)
  );

  useEffect(() => {
    if (!authenticated || !accountId) return;

    const key = getStorageKey(accountId);
    const saved = localStorage.getItem(key);

    if (saved) {
      const parsed = JSON.parse(saved);

      const updated = {
        ...parsed,
        userEmail,
        walletAddress: walletAddress || parsed.walletAddress,
        stakedBalance: parsed.stakedBalance || 0,
      };

      localStorage.setItem(key, JSON.stringify(updated));
      setAccount(updated);
      return;
    }

    const fresh = createFreshAccount(accountId, userEmail, walletAddress);
    localStorage.setItem(key, JSON.stringify(fresh));
    setAccount(fresh);
  }, [authenticated, accountId, userEmail, walletAddress]);

  function saveAccount(nextAccount) {
    setAccount(nextAccount);
    localStorage.setItem(getStorageKey(accountId), JSON.stringify(nextAccount));
  }

  function addActivity(nextAccount, title, detail) {
    return {
      ...nextAccount,
      activity: [
        {
          title,
          detail,
          time: new Date().toISOString(),
        },
        ...(nextAccount.activity || []),
      ].slice(0, 10),
    };
  }

  function handleSendNDG() {
    if (!account) {
      setMessage("Create or load an Easy Access account first.");
      return;
    }

    const cleanRecipient = recipient.trim();
    const cleanAmount = Number(amount);

    if (!cleanRecipient) {
      setMessage("Enter a recipient wallet or account ID.");
      return;
    }

    if (!cleanAmount || cleanAmount <= 0) {
      setMessage("Enter a valid NDG amount.");
      return;
    }

    if (cleanAmount > account.ndgBalance) {
      setMessage("Insufficient NDG balance.");
      return;
    }

    let nextAccount = {
      ...account,
      ndgBalance: Number((account.ndgBalance - cleanAmount).toFixed(2)),
    };

    nextAccount = addActivity(
      nextAccount,
      `${cleanAmount} NDG sent`,
      `Recipient: ${cleanRecipient} • Gas Fee: 0 • Network Fee: 0`
    );

    saveAccount(nextAccount);
    setMessage(`${cleanAmount} NDG sent. Gas Fee: 0. Network Fee: 0.`);
  }

  function handleBuyNDG() {
    if (!account) {
      setMessage("Create or load an Easy Access account first.");
      return;
    }

    const usd = Number(buyUsd);

    if (!usd || usd < MIN_BUY_USD) {
      setMessage(`Minimum buy amount is $${MIN_BUY_USD}.`);
      return;
    }

    const ndgAmount = Number((usd / NDG_PRICE_USD).toFixed(2));

    let nextAccount = {
      ...account,
      ndgBalance: Number((account.ndgBalance + ndgAmount).toFixed(2)),
    };

    nextAccount = addActivity(
      nextAccount,
      `${ndgAmount} NDG bought`,
      `Preview payment: $${usd} • Price: $${NDG_PRICE_USD} per NDG • Gas Fee: 0`
    );

    saveAccount(nextAccount);
    setBuyOpen(false);
    setMessage(`${ndgAmount} NDG bought successfully. Gas Fee: 0.`);
  }

  function handleStakeNDG() {
    if (!account) {
      setMessage("Create or load an Easy Access account first.");
      return;
    }

    const cleanStakeAmount = Number(stakeAmount);
    const cleanLockPeriod = Number(stakeLockPeriod);

    if (!cleanStakeAmount || cleanStakeAmount <= 0) {
      setMessage("Enter a valid NDG staking amount.");
      return;
    }

    if (cleanStakeAmount > account.ndgBalance) {
      setMessage("Insufficient NDG balance for staking.");
      return;
    }

    let nextAccount = {
      ...account,
      ndgBalance: Number((account.ndgBalance - cleanStakeAmount).toFixed(2)),
      stakedBalance: Number(
        ((account.stakedBalance || 0) + cleanStakeAmount).toFixed(2)
      ),
    };

    nextAccount = addActivity(
      nextAccount,
      `${cleanStakeAmount} NDG staked`,
      `Lock Period: ${cleanLockPeriod} days • Estimated Reward: ${estimatedStakeReward} NDG • Gas Fee: 0`
    );

    saveAccount(nextAccount);
    setStakeOpen(false);
    setMessage(
      `${cleanStakeAmount} NDG staked in preview mode. Estimated reward: ${estimatedStakeReward} NDG.`
    );
  }

  if (!ready) {
    return (
      <div className="ndg-page ndg-loading">
        Loading NetDAG Easy Access...
      </div>
    );
  }

  return (
    <main className="ndg-page">
      <div className="ndg-ticker">
        <span>
          Protected login •  NDG utility from day one •  
        </span>
      </div>

      <header className="ndg-site-header">
        <a href="https://www.netdag.com" className="ndg-brand">
          <img src="/images/ndg-logo.png" alt="NetDAG logo" />
          <span>NetDAG</span>
        </a>

        <nav className="ndg-top-nav" aria-label="NetDAG navigation">
          <a href="https://www.netdag.com">Home</a>
          <a href="https://www.netdag.com/provenance.html">Provenance</a>
          <a href="https://www.netdag.com/no-gas.html">No Gas</a>
          <a href="https://www.netdag.com/purchase-ndg.html">Access NDG</a>
        </nav>

        <div className="ndg-header-action">
          {authenticated ? (
            <button type="button" onClick={logout}>
              Logout
            </button>
          ) : (
            <button type="button" onClick={login}>
              Login
            </button>
          )}
        </div>
      </header>

      <section className="ndg-card">
        <img src="/images/ndg-logo.png" alt="NetDAG" className="ndg-logo" />

        <h1>NetDAG Easy Access</h1>

        <p className="ndg-subtitle">No wallet. No seed phrase. No gas fees.</p>

        {!authenticated ? (
          <button className="ndg-primary-btn" onClick={login}>
            Sign in
          </button>
        ) : (
          <>
            <h2>Welcome</h2>

            <p className="ndg-user">{userEmail}</p>

            <div className="ndg-summary">
              <div className="ndg-summary-card">
                <span>Available NDG</span>
                <strong>{availableNdg} NDG</strong>
              </div>

              <div className="ndg-summary-card">
                <span>Staked NDG</span>
                <strong>{stakedNdg} NDG</strong>
              </div>

              <div className="ndg-summary-card">
                <span>Account Value</span>
                <strong>${accountValue}</strong>
              </div>
            </div>

            <div className="ndg-dashboard">
              <div className="ndg-row">
                <span>Account ID</span>
                <strong>{accountId}</strong>
              </div>

              <div className="ndg-row">
                <span>Wallet Address</span>
                <strong title={walletAddress || ""}>
                  {shortAddress(walletAddress)}
                </strong>
              </div>

              <div className="ndg-row">
                <span>NDG Balance</span>
                <strong>{account?.ndgBalance ?? STARTER_BALANCE} NDG</strong>
              </div>

              <div className="ndg-row">
                <span>Staked NDG</span>
                <strong>{account?.stakedBalance ?? 0} NDG</strong>
              </div>

              <div className="ndg-row">
                <span>BNB Balance</span>
                <strong>{account?.bnbBalance ?? 0} BNB</strong>
              </div>

              <div className="ndg-row">
                <span>Login Status</span>
                <strong className="ndg-status">Protected</strong>
              </div>
            </div>

            <div className="ndg-send-box">
              <h3>Send NDG</h3>

              <label>Recipient Wallet / Account</label>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="NDG-USER-TEST01 or 0x..."
              />

              <label>Amount</label>
              <input
                type="number"
                value={amount}
                min="1"
                onChange={(event) => setAmount(event.target.value)}
              />

              <button className="ndg-primary-btn" onClick={handleSendNDG}>
                Send NDG
              </button>
            </div>

            {message && <div className="ndg-message">{message}</div>}

            <div className="ndg-activity">
              <h3>Recent Activity</h3>

              {(account?.activity || []).map((item, index) => (
                <article
                  className={`ndg-activity-item ${
                    index === 0 ? "ndg-activity-latest" : ""
                  }`}
                  key={`${item.title}-${item.time}`}
                >
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{formatTime(item.time)}</small>
                </article>
              ))}
            </div>

            <div className="ndg-actions">
              <button
                className="ndg-secondary-btn"
                onClick={() => setBuyOpen(true)}
              >
                Buy NDG
              </button>

              <button
                className="ndg-secondary-btn"
                onClick={() => setStakeOpen(true)}
              >
                Stake NDG
              </button>

              <button
                className="ndg-secondary-btn"
                onClick={() => setProvenanceOpen(true)}
                disabled={!activeProduct}
              >
                Verify Product
              </button>

              <button
                className="ndg-secondary-btn"
                onClick={() => setQrOpen(true)}
                disabled={!activeProduct}
              >
                QR Verification
              </button>
            </div>

            <button className="ndg-logout-btn" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </section>

      <footer className="ndg-site-footer">
        <p>
        Use NDG without confusion or wallet complexity.
        </p>

        <div>
          <a href="https://www.netdag.com">Home</a>
          <a href="https://www.netdag.com/provenance.html">Provenance</a>
          <a href="https://www.netdag.com/no-gas.html">No Gas</a>
           <a href="https://www.netdag.com/menu/whitepaper.html">Whitepaper</a>
        </div>

      </footer>

      {buyOpen && (
        <div className="ndg-modal-backdrop">
          <div className="ndg-modal">
            <button
              className="ndg-modal-close"
              onClick={() => setBuyOpen(false)}
            >
              ×
            </button>

            <h2>Buy NDG</h2>

            <p className="ndg-modal-note">
              Purchase NDG through NetDAG Easy Access.
            </p>

            <label>USD Amount</label>
            <input
              type="number"
              min={MIN_BUY_USD}
              value={buyUsd}
              onChange={(event) => setBuyUsd(event.target.value)}
            />

            <div className="ndg-buy-preview">
              <span>You Receive</span>
              <strong>{buyReceiveAmount || 0} NDG</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Price</span>
              <strong>${NDG_PRICE_USD} / NDG</strong>
            </div>

            <button className="ndg-primary-btn" onClick={handleBuyNDG}>
              Buy NDG
            </button>
          </div>
        </div>
      )}

      {stakeOpen && (
        <div className="ndg-modal-backdrop">
          <div className="ndg-modal">
            <button
              className="ndg-modal-close"
              onClick={() => setStakeOpen(false)}
            >
              ×
            </button>

            <h2>Stake NDG</h2>

            <p className="ndg-modal-note">Stake your NDG and earn rewards.</p>

            <label>Amount to Stake</label>
            <input
              type="number"
              min="1"
              value={stakeAmount}
              onChange={(event) => setStakeAmount(event.target.value)}
            />

            <label>Lock Period</label>
            <select
              value={stakeLockPeriod}
              onChange={(event) => setStakeLockPeriod(event.target.value)}
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
            </select>

            <div className="ndg-buy-preview">
              <span>Estimated Reward</span>
              <strong>{estimatedStakeReward || 0} NDG</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Gas Fee</span>
              <strong>0</strong>
            </div>

            <button className="ndg-primary-btn" onClick={handleStakeNDG}>
              Stake NDG
            </button>
          </div>
        </div>
      )}

      {provenanceOpen && activeProduct && (
        <div className="ndg-modal-backdrop">
          <div className="ndg-modal">
            <button
              className="ndg-modal-close"
              onClick={() => setProvenanceOpen(false)}
            >
              ×
            </button>

            <h2>NetDAG Product Verification</h2>

            <p className="ndg-modal-note">
              Product verification powered by NetDAG Provenance.
            </p>

            <label>Select Product</label>
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(Number(event.target.value))}
            >
              {provenanceProducts.map((product, index) => (
                <option value={index} key={product.recordId}>
                  {product.name}
                </option>
              ))}
            </select>

            <div className="ndg-buy-preview">
              <span>Product</span>
              <strong>{activeProduct.name}</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Status</span>
              <strong>{activeProduct.status}</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Guardian Confidence</span>
              <strong>{activeProduct.guardian}</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Record ID</span>
              <strong>{activeProduct.recordId}</strong>
            </div>

            <button
              className="ndg-primary-btn"
              onClick={() => {
                window.open(
                  `https://www.netdag.com/provenance.html?id=${encodeURIComponent(
                    activeProduct.recordId
                  )}#prov-mvp-demo`,
                  "_blank"
                );
              }}
            >
              Open Certificate
            </button>
          </div>
        </div>
      )}

      {qrOpen && activeProduct && (
        <div className="ndg-modal-backdrop">
          <div className="ndg-modal">
            <button className="ndg-modal-close" onClick={() => setQrOpen(false)}>
              ×
            </button>

            <h2>NetDAG QR Verification</h2>

            <p className="ndg-modal-note">
              Scan this QR code to verify product authenticity.
            </p>

            <div className="ndg-qr-box">
              <QRCodeSVG
                value={`https://www.netdag.com/provenance.html?id=${activeProduct.recordId}`}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
              />

              <p>Scan to Verify</p>
            </div>

            <div className="ndg-buy-preview">
              <span>Selected Product</span>
              <strong>{activeProduct.name}</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Record ID</span>
              <strong>{activeProduct.recordId}</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Status</span>
              <strong>{activeProduct.status}</strong>
            </div>

            <div className="ndg-buy-preview">
              <span>Guardian Confidence</span>
              <strong>{activeProduct.guardian}</strong>
            </div>

            <button className="ndg-primary-btn" onClick={() => setQrOpen(false)}>
              Verified
            </button>
          </div>
        </div>
      )}
    </main>
  );
}