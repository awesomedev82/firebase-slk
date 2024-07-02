function extractCleanUrl(rawUrl) {
  if (typeof rawUrl !== "string") {
    return null;
  }
  const match = rawUrl.match(/url=([^&]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

module.exports = extractCleanUrl;
