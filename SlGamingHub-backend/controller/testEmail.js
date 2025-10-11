
require("dotenv").config();
const sendEmail = require("./sendEmail");

(async () => {
  try {
    await sendEmail("your_receiver_email@example.com", "Test OTP", "This is a test email.");
    console.log("Test email sent!");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
})();
