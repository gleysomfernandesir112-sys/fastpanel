const NodeCache = require('node-cache');

// Create a new cache instance
// stdTTL: The standard time-to-live in seconds for every new entry.
// checkperiod: The period in seconds, as a number, used for the automatic delete check interval.
const playlistCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

console.log('Playlist cache service initialized.');

module.exports = playlistCache;
