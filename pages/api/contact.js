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
    host: smtp.zoho.eu,
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_SMTP_USER,
      pass: process.env.ZOHO_SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: '"Website Contact" <info@netdag.com>',
      to: "info@netdag.com",
      subject: "New Contact Form Submission",
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    });
    res.status(200).json({ success: true, message: "Email sent!" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Mail failed",
      error: error.message,
      stack: error.stack,
    });
  }
}