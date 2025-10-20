const { exec } = require('child_process');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const playlistCache = require('./cacheService'); // Assuming cacheService is available

// In-memory storage for content counts and system info
// In a production environment, this might be persisted in a database or a more robust cache
let systemInfo = {
  apiStatus: 'Offline', // Will be updated when API starts
  ramUsage: 'N/A',
  cpuUsage: 'N/A',
};

let contentCounts = {
  liveChannels: 0,
  movies: 0,
  seriesEpisodes: 0,
};

let lastAddedContent = [];
const MAX_LAST_ADDED_CONTENT = 10; // Define a maximum size for the array

/**
 * Fetches system information (RAM and CPU usage) from the OS.
 * This function is designed for Linux environments.
 * @returns {Promise<object>} An object containing ramUsage and cpuUsage.
 */
const getSystemInfo = async () => {
  // For API Status, we can assume it's online if this function is called successfully
  systemInfo.apiStatus = 'Online';

  // Get RAM Usage (Linux: free -h)
  try {
    const ramOutput = await new Promise((resolve, reject) => {
      exec('free -h', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          // Don't reject, just log and continue with N/A
        }
        resolve(stdout);
      });
    });
    const lines = ramOutput.split('\n');
    const memLine = lines[1]; // Second line usually contains memory info
    const parts = memLine.split(/\s+/);
    systemInfo.ramUsage = `Total: ${parts[1]}, Used: ${parts[2]}, Free: ${parts[3]}`;
  } catch (error) {
    console.error('Failed to get RAM usage:', error.message);
    systemInfo.ramUsage = 'Error fetching RAM usage';
  }

  // Get CPU Usage (Linux: top -bn1 | grep "Cpu(s)")
  try {
    const cpuOutput = await new Promise((resolve, reject) => {
      exec('top -bn1 | grep "Cpu(s)"', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          // Don't reject, just log and continue with N/A
        }
        resolve(stdout);
      });
    });
    const cpuLine = cpuOutput.trim();
    const usageMatch = cpuLine.match(/(\d+\.\d+)%us/); // User space CPU usage
    if (usageMatch && usageMatch[1]) {
      systemInfo.cpuUsage = `${usageMatch[1]}%`;
    } else {
      systemInfo.cpuUsage = 'N/A';
    }
  } catch (error) {
    console.error('Failed to get CPU usage:', error.message);
    systemInfo.cpuUsage = 'Error fetching CPU usage';
  }

  return systemInfo;
};

/**
 * Updates content counts based on the Master Client Playlist.
 * This should be called after playlist processing or stream modifications.
 */
const updateContentCounts = async () => {
  console.log('[DashboardService] Updating content counts...');
  let liveChannels = 0;
  let movies = 0;
  let seriesEpisodes = 0;

  try {
    const masterPlaylist = await prisma.playlist.findFirst({
      where: { name: "Master Client Playlist" },
      include: { streams: true },
    });

    if (!masterPlaylist || !masterPlaylist.streams) {
      console.log('[DashboardService] Master Client Playlist not found or has no streams.');
      contentCounts = { liveChannels: 0, movies: 0, seriesEpisodes: 0 };
      return;
    }

    masterPlaylist.streams.forEach(stream => {
      const name = stream.name.toLowerCase();
      const url = stream.streamUrl.toLowerCase();

      // Heuristics for categorization
      // Live Channels
      if (name.includes('ao vivo') || name.includes('live') || name.includes('tv') ||
          url.includes('live') || url.includes('tv')) {
        liveChannels++;
      } 
      // Movies
      else if (name.includes('filme') || name.includes('movie') ||
               name.includes('cinema') || url.includes('filme') || url.includes('movie')) {
        movies++;
      }
      // Series Episodes (look for SXXEXX patterns or common series keywords)
      else if (name.match(/s\d+e\d+/) || name.includes('serie') || name.includes('series') ||
               name.includes('temporada') || url.includes('serie') || url.includes('series')) {
        seriesEpisodes++;
      }
      // Default to live channels if no other category matches (common for IPTV)
      else {
        liveChannels++;
      }
    });

    contentCounts = {
      liveChannels,
      movies,
      seriesEpisodes,
    };
    console.log('[DashboardService] Content counts updated:', contentCounts);

  } catch (error) {
    console.error('[DashboardService] Error updating content counts:', error);
    contentCounts = { liveChannels: 0, movies: 0, seriesEpisodes: 0 }; // Reset on error
  }
};

/**
 * Returns the current content counts.
 * @returns {object} An object containing liveChannels, movies, and seriesEpisodes counts.
 */
const getContentCounts = () => {
  return contentCounts;
};

/**
 * Adds a content item to the list of last added content.
 * Maintains a fixed size for the list.
 * @param {object} item The content item to add.
 */
const addLastAddedContent = (item) => {
  // Add timestamp to the item
  const newItem = { ...item, addedAt: new Date().toISOString() };
  lastAddedContent.unshift(newItem); // Add to the beginning

  // Trim the array if it exceeds the maximum size
  if (lastAddedContent.length > MAX_LAST_ADDED_CONTENT) {
    lastAddedContent = lastAddedContent.slice(0, MAX_LAST_ADDED_CONTENT);
  }
};

/**
 * Returns the list of last added content.
 * @returns {Array<object>} The list of last added content.
 */
const getLastAddedContent = () => {
  return lastAddedContent;
};

module.exports = {
  getSystemInfo,
  updateContentCounts,
  getContentCounts,
  addLastAddedContent,
  getLastAddedContent,
};