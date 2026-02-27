import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  const { firstName, lastName, email, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    res.status(400).json({ success: false, message: "All fields required" });
    return;
  }

  let transporter = nodemailer.createTransport({
  host: "smtp.zoho.eu",      // uses your env var
  port: "465",   // uses your env var
  secure: "true", // true for SSL (465), false for TLS (587)
  auth: {
    user: info@netdag.com,
    pass: "U9Un7Y8xiDrB",
  },
});

  try {
    await transporter.sendMail({
      from: '"Website Contact" <info@netdag.com>', // sender address
      to: "info@netdag.com",                       // receiver (your Zoho inbox)
      subject: "New Contact Form Submission",
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    });true
    res.status(200).json({ success: true, message: "Email sent!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Mail failed", error: error.message });
  }
}