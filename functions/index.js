const {initializeApp} = require("firebase-admin/app");
const functions = require("firebase-functions");
const runtimeOpts = require("./config/runtimeOpts");

initializeApp();

const scrapeArticles = require("./functions/scrapeArticles");
const fetchEmails = require("./functions/fetchEmails");
const sendLeads = require("./functions/sendLeads");

exports.scrapeArticles = functions.runWith(runtimeOpts).https.onRequest(scrapeArticles);
exports.sendLeads = functions.runWith(runtimeOpts).https.onRequest(sendLeads);
exports.fetchEmails = functions.runWith(runtimeOpts).https.onRequest(fetchEmails);
