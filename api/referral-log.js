// ============================================================
// NetDAG Referral Log API
// Vercel Serverless Function
//
// Frontend -> /api/referral-log.js -> Google Apps Script -> Google Sheet
//
// Purpose:
// Records referral proof after a successful NDG purchase.
// This does NOT pay referral bonuses automatically.
// It logs the record for manual/semi-manual review and payout.
// ============================================================

const REFERRAL_BONUS_PERCENT = 5;

const ALLOWED_PRESALE_CONTRACT =
  "0xAc9E6f29C78E4a3cDdd3bDDC3d58a8A46224B160".toLowerCase();

const BSC_TESTNET_EXPLORER = "https://testnet.bscscan.com";

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || "").trim());
}

function isTxHash(value) {
  return /^0x[a-fA-F0-9]{64}$/.test(String(value || "").trim());
}

function cleanAddress(value) {
  return String(value || "").trim();
}

function cleanString(value) {
  return String(value || "").trim();
}

function cleanNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function json(res, statusCode, data) {
  res.status(statusCode).json(data);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, {
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const webhookUrl = process.env.REFERRAL_SHEETS_WEBHOOK_URL;
    const secret = process.env.REFERRAL_LOG_SECRET;

    if (!webhookUrl || !secret) {
      return json(res, 500, {
        ok: false,
        error: "Referral logging is not configured on the server."
      });
    }

    const body = req.body || {};

    const referrerWallet = cleanAddress(body.referrerWallet);
    const buyerWallet = cleanAddress(body.buyerWallet);
    const transactionHash = cleanString(body.transactionHash);
    const presaleContract = cleanAddress(body.presaleContract);
    const sourcePage = cleanString(body.sourcePage || "unknown");

    const usdAmount = cleanNumber(body.usdAmount);
    const bnbPaid = cleanNumber(body.bnbPaid);
    const ndgBought = cleanNumber(body.ndgBought);

    if (!isAddress(referrerWallet)) {
      return json(res, 400, {
        ok: false,
        error: "Invalid referrer wallet."
      });
    }

    if (!isAddress(buyerWallet)) {
      return json(res, 400, {
        ok: false,
        error: "Invalid buyer wallet."
      });
    }

    if (referrerWallet.toLowerCase() === buyerWallet.toLowerCase()) {
      return json(res, 400, {
        ok: false,
        error: "Referrer and buyer cannot be the same wallet."
      });
    }

    if (!isTxHash(transactionHash)) {
      return json(res, 400, {
        ok: false,
        error: "Invalid transaction hash."
      });
    }

    if (!isAddress(presaleContract)) {
      return json(res, 400, {
        ok: false,
        error: "Invalid presale contract."
      });
    }

    if (presaleContract.toLowerCase() !== ALLOWED_PRESALE_CONTRACT) {
      return json(res, 400, {
        ok: false,
        error: "Wrong presale contract."
      });
    }

    if (usdAmount <= 0 || bnbPaid <= 0 || ndgBought <= 0) {
      return json(res, 400, {
        ok: false,
        error: "Invalid purchase amount."
      });
    }

    const referralBonusNDG = ndgBought * (REFERRAL_BONUS_PERCENT / 100);

    const record = {
      secret,
      createdAt: new Date().toISOString(),
      status: "PENDING_REVIEW",
      referrerWallet,
      buyerWallet,
      transactionHash,
      presaleContract,
      usdAmount: usdAmount.toString(),
      bnbPaid: bnbPaid.toString(),
      ndgBought: ndgBought.toString(),
      referralBonusNDG: referralBonusNDG.toString(),
      referralBonusPercent: REFERRAL_BONUS_PERCENT.toString(),
      bscScanLink: `${BSC_TESTNET_EXPLORER}/tx/${transactionHash}`,
      sourcePage,
      network: "bsc-testnet",
      notes: "Pending manual verification before referral bonus payout."
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(record)
    });

    const text = await response.text();

    if (!response.ok) {
      return json(res, 502, {
        ok: false,
        error: "Google Sheets webhook failed.",
        details: text
      });
    }

    return json(res, 200, {
      ok: true,
      message: "Referral logged for manual review.",
      referralBonusNDG,
      record
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error && error.message ? error.message : "Referral log failed."
    });
  }
}