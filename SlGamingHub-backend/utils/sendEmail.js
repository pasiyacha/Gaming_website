const nodemailer = require("nodemailer");

// Check if email is configured
const isEmailConfigured = () => {
  return process.env.SMTP_HOST && 
         process.env.SMTP_PORT && 
         process.env.SMTP_USER && 
         process.env.SMTP_PASS;
};

// Create transporter only if configured
let transporter = null;
if (isEmailConfigured()) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,           // ex: "smtp.gmail.com"
      port: Number(process.env.SMTP_PORT),   // ex: 587
      secure: process.env.SMTP_SECURE === 'true',  // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,         // ex: "yourgmail@gmail.com"
        pass: process.env.SMTP_PASS,         // app password or email password
      },
      // Add timeout to prevent hanging
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
    });
    console.log("Email transporter configured successfully");
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    transporter = null;
  }
} else {
  console.log("Email not configured. Email notifications will be disabled.");
}

async function sendEmail(to, subject, text) {
  // If email is not configured, silently exit without error
  if (!transporter) {
    console.log("Skipping email send - email not configured");
    return { success: false, reason: "Email not configured", skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"SL Gaming Hub" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending error:", error);
    // Don't throw the error - return error info instead
    return { 
      success: false, 
      reason: error.message || "Unknown error", 
      code: error.code || "UNKNOWN",
      skipped: false
    };
  }
}

module.exports = sendEmail;
