const admin = require("firebase-admin");
const corsHandler = require("../config/cors");
const sendEmail = require("../helpers/sendEmail");


async function sendLeads(req, res) {
  corsHandler(req, res, async () => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Cross-Origin-Opener-Policy", "same-origin");

    const db = admin.firestore();

    if (req.method !== "POST") {
      res.status(405).json({
        data: {
          message: "Method Not Allowed",
        },
      });
      return;
    }

    try {
      const recipients = await db.collection("aiProps").doc("checkerProps").get().then((doc) => doc.data().notificationEmails);

      const articles = [];

      const disasterIncident = await db.collection("articles").where("isSent", "==", false).get();

      if (disasterIncident.docs.length <= 0) {
        console.log("No disaster incidents found");
        res.status(200).json({
          status: "success",
          data: {
            message: "No articles to send.",
          },
        });
        return;
      }

      disasterIncident.docs.forEach((doc) => {
        const articleTitle = doc.data().articleTitle;
        const articleDescription = doc.data().articleDescription;
        const articleLink = doc.data().url;
        const articleLocations = doc.data().locations;
        const articleZip = doc.data().zip;

        function zipCodesToString(articleZip) {
          return articleZip.join(", ");
        }

        let articleZips;
        if (Array.isArray(articleZip)) {
          articleZips = zipCodesToString(articleZip);
        } else {
          articleZips = articleZip;
        }

        articles.push({
          articleTitle,
          articleDescription,
          articleLink,
          articleLocations,
          articleZips,
        });
      });

      const tableRowsHtml = articles.map((article) => `
          <tr>
            <td style="font-size: 12.5pt;"><a href="${article.articleLink}">${article.articleTitle}</a></td>
          </tr>
          <tr>
            <td style="font-size: 11pt;">${article.articleDescription}</td>
          </tr>
          <tr>
            <td style="font-size: 11pt;">${article.articleLocations}</td>
          </tr>
          <tr style="border-bottom: 0.75px solid grey; margin-bottom: 25px;">
            <td style="font-size: 11pt;">${article.articleZips}</td>
          </tr>
          <br/ > <br/ > 
        `).join("");

      const emailPromises = [];
      for (const recipient of recipients) {
        const promise = sendEmail(recipient, tableRowsHtml)
            .then(async () => {
              const allArticlesSnapshot = await db.collection("articles").get();
              const updatePromises = allArticlesSnapshot.docs.map((doc) => {
                return db.collection("articles").doc(doc.id).update({
                  isSent: true,
                });
              });
              await Promise.all(updatePromises);
            })
            .catch((err) => {
              throw err;
            });
        emailPromises.push(promise);
      }

      await Promise.all(emailPromises);

      res.status(200).json({
        data: {
          message: "all emails sent successfully",
        },
      });
    } catch (err) {
      console.error("Error encountered:", err.message);
      console.error(
          "Detailed error:",
          err.stack || JSON.stringify(err, null, 2),
      );
      res.status(500).json({
        data: {
          error: err.message,
          message: err.message,
        },
      });
    }
  });
}

module.exports = sendLeads;
