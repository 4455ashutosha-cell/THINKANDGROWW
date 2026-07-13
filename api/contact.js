import nodemailer from "nodemailer";

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (character) => {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return characters[character];
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST requests are allowed",
    });
  }

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const safeName = String(name).trim().slice(0, 100);
  const safeEmail = String(email).trim().slice(0, 150);
  const safeSubject = String(subject).trim().slice(0, 150);
  const safeMessage = String(message).trim().slice(0, 5000);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(safeEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Think & Grow Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      replyTo: safeEmail,
      subject: `Website message: ${safeSubject}`,
      text: `
New contact form message

Name: ${safeName}
Email: ${safeEmail}
Subject: ${safeSubject}

Message:
${safeMessage}
      `,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>New Think & Grow Contact Message</h2>
          <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(safeMessage).replace(/\n/g, "<br>")}</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Email sending error:", error);

    return res.status(500).json({
      success: false,
      message: "Message could not be sent",
    });
  }
}