const express = require('express');
const router = express.Router();
const {
  listSourcePlaylists,
  createSourcePlaylist,
  deleteSourcePlaylist,
  getSourcePlaylistContent,
  updateSourcePlaylistContent,
} = require('../controllers/sourcePlaylistController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// All routes in this file are protected and require at least MASTER_RESELLER role
router.use(protect, restrictTo('MASTER_RESELLER', 'SUPER_ADMIN'));

// GET /api/source-playlists
router.get('/', listSourcePlaylists);

// POST /api/source-playlists (now accepts text content)
router.post('/', createSourcePlaylist);

// DELETE /api/source-playlists/:id
router.delete('/:id', deleteSourcePlaylist);

// GET /api/source-playlists/:id/content
router.get('/:id/content', getSourcePlaylistContent);

// PUT /api/source-playlists/:id/content
router.put('/:id/content', updateSourcePlaylistContent);

module.exports = router;
