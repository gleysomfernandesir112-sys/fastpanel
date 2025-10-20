const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const fs = require('fs').promises;
const path = require('path');
const { parseM3uFromFile, parseM3uContent } = require('../services/m3uParserService');

const UPLOAD_DIR = path.join(__dirname, '..', 'source_playlists');

// Ensure the upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// @desc    Get all source playlists
// @route   GET /api/source-playlists
// @access  Private
const listSourcePlaylists = async (req, res) => {
  try {
    const playlists = await prisma.sourcePlaylist.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch source playlists', error });
  }
};

// @desc    Create a new source playlist from text content
// @route   POST /api/source-playlists
// @access  Private
const createSourcePlaylist = async (req, res) => {
  const { name, type, content } = req.body;

  if (!name || !type || !content) {
    return res.status(400).json({ message: 'Please provide name, type, and M3U content.' });
  }

  const safeName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const fileName = `${Date.now()}-${safeName}.m3u`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    // 1. Write the content to a new file
    await fs.writeFile(filePath, content);

    // 2. Parse the new file to get stream count
    const parsed = await parseM3uFromFile(filePath);
    const streamCount = parsed.items.length;

    if (streamCount === 0) {
      await fs.unlink(filePath); // Clean up the empty file
      return res.status(400).json({ message: 'The provided M3U content is empty or invalid.' });
    }

    // 3. Create the record in the database
    const newPlaylist = await prisma.sourcePlaylist.create({
      data: {
        name,
        type,
        filePath,
        streamCount,
      },
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    await fs.unlink(filePath).catch(err => console.error('Failed to clean up file after error:', err));
    if (error.code === 'P2002') {
      return res.status(409).json({ message: `A playlist with the name "${name}" already exists.` });
    }
    res.status(500).json({ message: 'Failed to create source playlist.', error });
  }
};

// @desc    Get the text content of a source playlist
// @route   GET /api/source-playlists/:id/content
// @access  Private
const getSourcePlaylistContent = async (req, res) => {
    const { id } = req.params;
    try {
        const playlist = await prisma.sourcePlaylist.findUnique({
            where: { id: parseInt(id) },
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found.' });
        }

        const content = await fs.readFile(playlist.filePath, 'utf-8');
        res.header('Content-Type', 'text/plain');
        res.status(200).send(content);
    } catch (error) {
        res.status(500).json({ message: 'Failed to read playlist content.', error });
    }
};

// @desc    Update the text content of a source playlist
// @route   PUT /api/source-playlists/:id/content
// @access  Private
const updateSourcePlaylistContent = async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (typeof content !== 'string') {
        return res.status(400).json({ message: 'Request body must contain M3U content string.' });
    }

    try {
        const playlist = await prisma.sourcePlaylist.findUnique({
            where: { id: parseInt(id) },
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found.' });
        }

        // 1. Overwrite the file
        await fs.writeFile(playlist.filePath, content);

        // 2. Re-parse to get the new stream count
        const parsed = parseM3uContent(content);
        const newStreamCount = parsed.items.length;

        // 3. Update the stream count in the database
        const updatedPlaylist = await prisma.sourcePlaylist.update({
            where: { id: parseInt(id) },
            data: { streamCount: newStreamCount },
        });

        res.status(200).json(updatedPlaylist);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update playlist content.', error });
    }
};

// @desc    Delete a source playlist
// @route   DELETE /api/source-playlists/:id
// @access  Private
const deleteSourcePlaylist = async (req, res) => {
  const { id } = req.params;

  try {
    const playlist = await prisma.sourcePlaylist.findUnique({
      where: { id: parseInt(id) },
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    await prisma.sourcePlaylist.delete({
      where: { id: parseInt(id) },
    });

    await fs.unlink(playlist.filePath).catch(err => {
        console.error(`Failed to delete file ${playlist.filePath}, but DB record was removed.`, err);
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete source playlist.', error });
  }
};

module.exports = {
  listSourcePlaylists,
  createSourcePlaylist,
  deleteSourcePlaylist,
  getSourcePlaylistContent,
  updateSourcePlaylistContent,
};
