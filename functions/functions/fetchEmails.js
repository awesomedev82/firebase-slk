const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {google} = require("googleapis");
const corsHandler = require("../config/cors");
const {generateDisasterBool} = require("../helpers/gpt");
const extractCleanUrl = require("../helpers/extractCleanUrl");

let oauth2Client;

async function setToken(accessToken) {
  try {
    const CLIENT_ID = functions.config().google.clientid;
    const CLIENT_SECRET = functions.config().google.clientsecret;

    oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        "https://seek-link.firebaseapp.com/__/auth/handler",
    );

    oauth2Client.setCredentials({access_token: accessToken});
  } catch (err) {
    console.error(err);
  }
}

async function fetchEmails(req, res) {
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
      const accessToken = req.body.data.access_token;

      setToken(accessToken);

      console.log("oauth2Client", oauth2Client);

      const gmail = google.gmail({version: "v1", auth: oauth2Client});

      const messagesRes = await gmail.users.messages.list({userId: "me", q: "is:unread", maxResults: 5});
      const messages = messagesRes.data.messages;

      if (messages && messages.length) {
        for (const message of messages) {
          const emailDetails = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full",
          });

          const {payload} = emailDetails.data;
          const subjectHeader = payload.headers.find((header) => header.name === "Subject");
          const subject = subjectHeader ? subjectHeader.value : "";

          if (subject.startsWith("Google Alert")) {
            const alertTitle = subject.replace("Google Alert - ", "");
            const body = payload.body;
            const parts = payload.parts;

            let alertItems = "";
            if (body.size > 0) {
              alertItems = Buffer.from(body.data, "base64").toString();
            } else if (parts) {
              alertItems = parts
                  .filter((part) => part.mimeType === "text/html")
                  .map((part) => Buffer.from(part.body.data, "base64").toString())
                  .join("");
            }

            const regexBegin = /^[\s\S]+?(?={)/;
            const regexEnd = /(?<=\}(?![\s\S]*\}))[\s\S]*$/;

            const beginResult = alertItems.match(regexBegin);
            const endResult = alertItems.match(regexEnd);
            const lastPosition = endResult.length - 1;

            alertItems = alertItems.replace(beginResult[0], "");
            alertItems = alertItems.replace(endResult[lastPosition], "");

            if (alertItems) {
              let jsonData = alertItems;
              jsonData = JSON.parse(jsonData);
              alertItems = jsonData.cards[0].widgets;
            } else {
              console.log("JSON data not found");
              alertItems = false;
            }

            if (alertItems) {
              const promises = [];
              const batch = db.batch();
              for (const widget of alertItems) {
                try {
                  const articleTitle = widget.title;
                  const articleDescription = widget.description;
                  const rawUrl = widget.url;
                  const url = extractCleanUrl(rawUrl);

                  const article = {
                    alertTitle, articleTitle, articleDescription, url, isSent: false, isScraped: false,
                  };

                  // const today = new Date().toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric", year: "numeric"});

                  const prompt = `Query: Based on the article below, return true or false if all the following criteria is met. \n a ${alertTitle} has happened within the last few days. \n Property damage has likely occurred \n The event likely happened in the USA or Canada? \n \n Article title: ${articleTitle} \n Article Description: ${articleDescription} \n \n return JSON in the following format {isDisaster : BOOLEAN} \n \n JSON:`;
                  console.log("prompt:", prompt);
                  promises.push(generateDisasterBool(prompt).then((res) => {
                    const result = res.choices[0].message.content;
                    const isDisaster = JSON.parse(result).isDisaster;
                    console.log("isDisaster:", isDisaster);
                    if ((isDisaster) && url !== undefined) {
                      const newDocRef = db.collection("articles").doc();
                      batch.set(newDocRef, article);
                    }
                  }).catch((err) => {
                    console.error("Error in GPT call:", err);
                  }));
                } catch (elementProcessingError) {
                  console.error("Error processing article element:", elementProcessingError);
                }
              }


              await Promise.all(promises);

              await batch.commit().catch((err) => {
                console.error("Batch commit failed: ", err);
              });

              await gmail.users.messages.modify({
                userId: "me",
                id: message.id,
                resource: {
                  removeLabelIds: ["UNREAD"],
                },
              }).then(() => {
                console.log("Message marked as read");
              });
            }
          }
        }
        res.status(200);
        res.json({
          data: {
            message: "Emails fetched and saved successfully!",
          },
        });
      } else {
        res.status(200);
        res.json({
          data: {
            message: "No messages found",
          },
        });
      }
    } catch (err) {
      console.error("Error encountered:", err.message);
      console.error(
          "Detailed error:",
          err.stack || JSON.stringify(err, null, 2),
      );
      res.status(500).json({data:
          {
            error: err,
            message: err.message,
          },
      });
    }
  });
}

module.exports = fetchEmails;
