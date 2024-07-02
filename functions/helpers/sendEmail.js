const emailjs = require("@emailjs/nodejs");

require("dotenv").config();

emailjs.init({
  publicKey: process.env.MAILJS_PUBLIC_KEY,
  privateKey: process.env.MAILJS_PRIVATE_KEY,
});

async function sendEmail(to, tableRowsHtml) {
  const emailParams = {
    from_name: "Seek Link",
    recipient: to,
    table_rows: tableRowsHtml,
  };

  try {
    const response = await emailjs.send(
        "gmail-service",
        "gmail-template",
        emailParams,
    );
    return response;
  } catch (error) {
    console.log("Error sending email:", error);
    throw error;
  }
}

module.exports = sendEmail;
