const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
const { parseM3uFromFile } = require('./src/services/m3uParserService');
const { generateM3u } = require('./src/services/m3uGeneratorService');

const QUEUE_DIR = path.join(__dirname, 'queue', 'new-clients');
const M3U_DIR = path.join(__dirname, 'M3U'); // Corrected path
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'https://iptvfast.me';

// Ensure M3U_DIR exists
fs.mkdir(M3U_DIR, { recursive: true }).catch(console.error);

// Function to process a client job
async function processClientJob(jobFilePath) {
    try {
        const jobData = JSON.parse(await fs.readFile(jobFilePath, 'utf8'));
        const { clientId, username } = jobData;

        console.log(`Processing job for client: ${username} (ID: ${clientId})`);

        // 1. Fetch client and their assigned source playlists
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: { sourcePlaylists: true },
        });

        if (!client) {
            throw new Error(`Client with ID ${clientId} not found.`);
        }

        if (!client.sourcePlaylists || client.sourcePlaylists.length === 0) {
            throw new Error(`Client ${username} has no source playlists assigned.`);
        }

        // 2. Parse all assigned M3U files and combine their streams
        let allStreams = [];
        console.log(`Found ${client.sourcePlaylists.length} playlists for ${username}.`);

        for (const sourcePlaylist of client.sourcePlaylists) {
            try {
                console.log(`Parsing playlist: ${sourcePlaylist.name} from ${sourcePlaylist.filePath}`);
                const parsedPlaylist = await parseM3uFromFile(sourcePlaylist.filePath);
                if (parsedPlaylist && parsedPlaylist.items) {
                    allStreams = allStreams.concat(parsedPlaylist.items);
                    console.log(`Added ${parsedPlaylist.items.length} streams from ${sourcePlaylist.name}. Total streams now: ${allStreams.length}`);
                }
            } catch (parseError) {
                console.error(`Could not parse playlist file ${sourcePlaylist.filePath} for playlist "${sourcePlaylist.name}". Skipping.`, parseError);
            }
        }

        // 3. Generate client-specific M3U content with restream links
        const clientM3uContent = generateM3u(allStreams, SERVER_BASE_URL);

        // 4. Save client M3U file
        const clientM3uFileName = `${username}.m3u`;
        const clientM3uPath = path.join(M3U_DIR, clientM3uFileName);
        await fs.writeFile(clientM3uPath, clientM3uContent);
        console.log(`Generated M3U for ${username} at ${clientM3uPath}`);

        // 5. Update client in database
        const m3uUrl = `/M3U/${clientM3uFileName}`;
        await prisma.client.update({
            where: { id: clientId },
            data: { m3uUrl },
        });
        console.log(`Client ${username} (ID: ${clientId}) updated with m3uUrl: ${m3uUrl}`);

        // 6. Delete job file
        await fs.unlink(jobFilePath);
        console.log(`Job file deleted: ${jobFilePath}`);

    } catch (error) {
        console.error(`Error processing job file ${jobFilePath}:`, error);
        // Optional: Move to a failed jobs directory
    }
}

// Watch for new files in the queue directory
const watcher = chokidar.watch(QUEUE_DIR, {
    ignored: /(^|[\\/])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    }
});

watcher
    .on('add', (filePath) => {
        console.log(`New job file detected: ${filePath}`);
        processClientJob(filePath);
    })
    .on('error', (error) => console.error(`Watcher error: ${error}`));

console.log(`Client processor started, watching for new jobs in ${QUEUE_DIR}`);

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Client processor shutting down...');
    await watcher.close();
    await prisma.$disconnect();
    process.exit(0);
});