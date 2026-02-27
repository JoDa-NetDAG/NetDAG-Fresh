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
    host: smtp.zoho.eu, // e.g. 'smtp.zoho.eu'
    port: 465, // 465 or 587
    auth: {
      user: process.env.ZOHO_SMTP_USER,    // your Zoho email
      pass: process.env.ZOHO_SMTP_PASS,    // your Zoho app password
    },
  });

  try {
    await transporter.sendMail({
      from: '"Website Contact" <info@netdag.com>', // sender address
      to: "info@netdag.com", // receiver (your Zoho inbox)
      subject: "New Contact Form Submission",
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    });
    res.status(200).json({ success: true, message: "Email sent!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Mail failed", error: error.message });
  }
}