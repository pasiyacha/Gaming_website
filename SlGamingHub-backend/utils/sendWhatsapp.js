const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsapp(to, message) {
  try {
    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });
    console.log("WhatsApp message sent:", msg.sid);
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

module.exports = sendWhatsapp;
