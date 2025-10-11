const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmail(to, subject, text) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: 'kavindiarunika26@gmail.com',
        pass: 'lbdyrkkpbyjvvifs',
      },
    });

    const info = await transporter.sendMail({
      from: `"SlGamingHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

module.exports = sendEmail;
