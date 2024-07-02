const cors = require("cors");

const corsHandler = cors({
  origin: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

module.exports = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  corsHandler(req, res, next);
};
