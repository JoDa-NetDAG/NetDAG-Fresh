// /api/contact.js  (CommonJS for your repo)
const nodemailer = require("nodemailer");

function clean(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

module.exports = async (req, res) => {
  // CORS (safe for your own site)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { firstName, lastName, email, message } = req.body || {};

    const fn = clean(firstName);
    const ln = clean(lastName);
    const fromEmail = clean(email);
    const msg = String(message || "").trim();

    if (!fn || !ln || !fromEmail || !msg) {
      return res.status(400).json({ ok: false, error: "All fields are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(fromEmail)) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST,              // smtppro.zoho.eu
      port: Number(process.env.ZOHO_SMTP_PORT || 465),
      secure: String(process.env.ZOHO_SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.ZOHO_SMTP_USER,           // info@netdag.com
        pass: process.env.ZOHO_SMTP_PASS,           // Zoho App Password
      },
    });

    const toAddress = process.env.CONTACT_TO || process.env.ZOHO_SMTP_USER;

    await transporter.sendMail({
      from: `"NetDAG Website" <${process.env.ZOHO_SMTP_USER}>`,
      to: toAddress,
      replyTo: fromEmail,
      subject: `NetDAG Contact — ${fn} ${ln}`,
      text: `First name: ${fn}\nLast name: ${ln}\nEmail: ${fromEmail}\n\nMessage:\n${msg}\n`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("CONTACT API ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};