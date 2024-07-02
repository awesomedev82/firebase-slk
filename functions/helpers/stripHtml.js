const cheerio = require("cheerio");
const he = require("he");

function stripHtml(html) {
  const $ = cheerio.load(html);
  const text = $.text();
  return he.decode(text);
}

module.exports = stripHtml;
