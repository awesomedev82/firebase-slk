const OpenAI = require("openai"); // Import the OpenAI SDK, assuming you've already installed it

require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI();
openai.apiKey = OPENAI_API_KEY;

async function generateZip(articleBody) {
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {role: "system", content: "List the top 1 to 3 likely zip codes this incident happened based on the most specific location. Return only an array of zip codes. "},
        {role: "user", content: articleBody},
      ],
      model: "gpt-4",
      max_tokens: 200,
      temperature: 0.2,
    });

    const articleZipString = response.choices[0].message.content;
    let articleZip;
    if (articleZipString.startsWith("[")) {
      articleZip = JSON.parse(articleZipString);
      return articleZip;
    } else {
      articleZip = "No zip code found";
    }

    return articleZip;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function generateLocations(articleBody) {
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {role: "system", content: "Based on the article, generate an array of the likely locations. If locations are detected, return only a coma separated list. if not, return not found"},
        {role: "user", content: articleBody},
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 200,
      temperature: 0.2,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function generateSummary(articleBody) {
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {role: "system", content: "Write a short summary of the article. Make sure to include the locations when possible."},
        {role: "user", content: articleBody},
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 200,
      temperature: 0.2,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function generateDisasterBool(prompt) {
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {role: "system", content: "Return only JSON"},
        {role: "user", content: prompt},
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 20,
      temperature: 0.1,
    });

    return response;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}


module.exports = {
  generateZip,
  generateLocations,
  generateSummary,
  generateDisasterBool,
};
