import nodemailer from "nodemailer";

// Define email options type
export interface EmailOptions {
  to: string; // Recipient email
  subject: string;
  text?: string;
  html?: string;
}

// Create and export transporter
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.G_EMAIL,
    pass: process.env.G_PASS,
  },
});

/**
 * Sends an email using the defined transporter.
 * @param {EmailOptions} options - Email options containing recipient, subject, and content.
 * @returns {Promise<string>} - Message ID if successful.
 */
export async function sendMail(options: EmailOptions): Promise<string> {
  try {
    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("✅ Email sent: %s", info.messageId);
    return info.messageId;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}
