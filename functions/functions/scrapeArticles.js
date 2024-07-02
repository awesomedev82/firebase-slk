const admin = require("firebase-admin");
const corsHandler = require("../config/cors");
const Parser = require("@postlight/parser");
const stripHtml = require("../helpers/stripHtml");
const {generateZip, generateLocations, generateSummary} = require("../helpers/gpt");

const db = admin.firestore();

async function fetchArticleContent(url) {
  console.log("Inside fetchArticleContent, url:", url);
  try {
    const result = await Parser.parse(url);
    console.log("Parsed Result:", result);
    return result;
  } catch (error) {
    console.error("Error fetching article content:", error);
    return null;
  }
}

async function scrapeAndUpdateArticle(doc) {
  const data = doc.data();
  const url = data.url;

  try {
    const articleContent = await fetchArticleContent(url);

    let hasContent;
    hasContent = stripHtml(articleContent.content);
    hasContent = hasContent.replace(" ", "");

    if (hasContent === "") {
      console.log("No article content for URL:", url);
      await doc.ref.update({
        isScraped: true,
        didFail: true,
      });
      return;
    }

    const articleDate = articleContent.date_published;
    const articleImage = articleContent.lead_image_url;
    const articleBody = stripHtml(articleContent.content);
    const articleSummaryRes = await generateSummary(articleBody);
    const articleSummary = articleSummaryRes;
    const articleLocationsRes = await generateLocations(articleSummary);
    const articleLocations = articleLocationsRes;
    const articleZip = await generateZip(articleLocations);

    await doc.ref.update({
      body: articleBody,
      locations: articleLocations,
      date: articleDate,
      image: articleImage,
      summary: articleSummary,
      zip: articleZip,
      isScraped: true, // Switch back to false so we can try again later
    });

    console.log("Updated article with id:", doc.id);
  } catch (error) {
    console.error("Error scraping and updating article:", error);
    await doc.ref.update({
      isScraped: true, // Switch back to false so we can try again later
      didFail: true,
    });
  }
}

async function scrapeArticles(req, res) {
  corsHandler(req, res, async () => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Cross-Origin-Opener-Policy", "same-origin");
    try {
      const snapshot = await db.collection("articles").where("isScraped", "==", false).get();

      if (snapshot.empty) {
        console.log("No articles to scrape.");
        res.status(200).json({
          data: {
            message: "No articles to scrape.",
          },
        });
        return;
      }

      const promises = [];
      snapshot.forEach((doc) => {
        promises.push(scrapeAndUpdateArticle(doc));
      });

      await Promise.all(promises);

      console.log("Scraping and updating complete.");
      res.status(200).json({
        data: {
          message: "Scraping and updating complete.",
        },
      });
    } catch (err) {
      console.error("An error occurred:", err);
      res.status(500).json({
        data: {
          error: err.message,
          message: err.message,
        },
      });
    }
  } );
}

module.exports = scrapeArticles;
