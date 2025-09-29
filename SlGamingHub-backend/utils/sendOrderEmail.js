function sendOrderConfirmationEmail(toEmail, order) {
  const mailOptions = {
    from: '"Your Company" <yourgmail@gmail.com>',
    to: toEmail,
    subject: `Order Confirmation - Order #${order._id}`,
    text: `Dear ${order.playerName},\n\nYour order with ID ${order._id} has been received and is currently ${order.status}.\n\nThank you for your purchase!`,
    // option to add html version too
    html: `<p>Dear ${order.playerName},</p><p>Your order with ID <b>${order._id}</b> has been received and is currently <b>${order.status}</b>.</p><p>Thank you for your purchase!</p>`,
  };

  return transporter.sendMail(mailOptions);
}
