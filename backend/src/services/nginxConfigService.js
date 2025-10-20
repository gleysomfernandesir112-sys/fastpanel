const fs = require('fs').promises;
const path = require('path');

// Define the directory where Nginx config files will be stored
// This should be configurable, but for now, a placeholder
const NGINX_CONFIG_DIR = process.env.NGINX_CONFIG_DIR || path.join(__dirname, '../../nginx_configs');
const NGINX_STREAMS_CONFIG_FILE = path.join(NGINX_CONFIG_DIR, 'fastpanel_streams.conf');

/**
 * Generates an Nginx location block for a single stream.
 * @param {object} stream The stream object (from iptv-playlist-parser output).
 * @param {string} localStreamPath The local path where Nginx will serve this stream (e.g., /live/channel_name).
 * @returns {string} The Nginx configuration string for the stream.
 */
const generateStreamConfig = (stream, localStreamPath) => {
  // This is a very basic example. Real Nginx config for restreaming can be complex.
  // It might involve RTMP, HLS, etc. For now, we'll assume a simple proxy.
  // The actual restreaming logic (e.g., ffmpeg, or specific Nginx modules) is beyond this scope.
  // This config just proxies the original stream URL.
return `
location ${localStreamPath} {
    proxy_pass ${stream.url};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # Add more proxy settings as needed for specific stream types
}
`;
};

/**
 * Generates the full Nginx configuration file content for all streams.
 * @param {Array<object>} streams A list of stream objects.
 * @param {string} baseUrl The base URL for the local Nginx server (e.g., http://localhost).
 * @returns {string} The full Nginx configuration file content.
 */
const generateNginxConfig = (streams, baseUrl) => {
  let configContent = '# FastPanel Generated Nginx Stream Configuration\n\n';
  for (const stream of streams) {
    // Create a unique, URL-friendly path for each stream
    const localStreamPath = `/live/${stream.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    configContent += generateStreamConfig(stream, localStreamPath);
  }
  return configContent;
};

/**
 * Writes the generated Nginx configuration to a file.
 * @param {string} configContent The Nginx configuration content to write.
 */
const writeNginxConfigFile = async (configContent) => {
  try {
    await fs.mkdir(NGINX_CONFIG_DIR, { recursive: true });
    await fs.writeFile(NGINX_STREAMS_CONFIG_FILE, configContent);
    console.log(`Nginx stream configuration written to ${NGINX_STREAMS_CONFIG_FILE}`);
  } catch (error) {
    console.error('Error writing Nginx configuration file:', error);
    throw new Error('Failed to write Nginx configuration file.');
  }
};

/**
 * Reloads the Nginx service.
 * This command is OS-dependent and requires appropriate permissions (e.g., sudo on Linux).
 */
const reloadNginx = async () => {
  // This is a placeholder. On Windows, Nginx might be run as a service or directly.
  // On Linux: `sudo systemctl reload nginx` or `sudo nginx -s reload`
  // For development on Windows, we'll just log a message.
  console.warn('Nginx reload command needs to be implemented for the target OS.');
  console.warn('Please ensure Nginx is configured to include:', NGINX_STREAMS_CONFIG_FILE);
  console.warn('And manually reload Nginx for changes to take effect during development.');
  // In a production Linux environment, you would execute:
  // const { exec } = require('child_process');
  // exec('sudo systemctl reload nginx', (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`exec error: ${error}`);
  //     return;
  //   }
  //   console.log(`stdout: ${stdout}`);
  //   console.error(`stderr: ${stderr}`);
  // });
};

module.exports = {
  generateNginxConfig,
  writeNginxConfigFile,
  reloadNginx,
};