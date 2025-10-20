const generateM3u = (items, serverBaseUrl) => {
  let m3uContent = '#EXTM3U\n';

  // Function to sanitize stream names for Nginx location blocks
  const sanitizeStreamName = (name) => {
    // Replace non-alphanumeric characters (except dot and hyphen) with underscore
    return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  };

  for (const item of items) {
    // The parser conveniently gives us the raw #EXTINF line
    const info = item.raw.split('\n')[0];
    
    // Extract tvg-name or the display name from the #EXTINF line for the URL
    const tvgNameMatch = info.match(/tvg-name="([^"]+)"/);
    const displayNameMatch = info.match(/,(.*)$/);
    const streamName = tvgNameMatch ? tvgNameMatch[1] : (displayNameMatch ? displayNameMatch[1].trim() : 'Unknown');

    const sanitizedName = sanitizeStreamName(streamName);
    const restreamUrl = `${serverBaseUrl}/live/${sanitizedName}`;

    if (info.startsWith('#EXTINF') && item.url) {
      m3uContent += `${info}\n${restreamUrl}\n`;
    }
  }

  return m3uContent;
};

module.exports = {
  generateM3u,
};

