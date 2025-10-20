const express = require('express');
const {
    deletePlaylist,
    refreshPlaylistStatus,
    generateClientPlaylist,
    getM3uFilesContent,
    synchronizeMasterPlaylist,
    getMasterPlaylistStreams,
    addMasterPlaylistStream,
    updateMasterPlaylistStream,
    deleteMasterPlaylistStream,
    analyzeM3uContent,
    createMasterPlaylistFromParsed,
    updateStreamType,
    getMasterPlaylistText,
    updateMasterPlaylistText,
} = require('../controllers/playlistController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

const authorizedRoles = restrictTo('SUPER_ADMIN', 'MASTER_RESELLER');

router.get('/get.php', generateClientPlaylist);

// These routes are temporarily public for debugging
router.get('/master-text', getMasterPlaylistText);
router.put('/master-text', updateMasterPlaylistText);

router.use(protect);

router.post('/sync-master', authorizedRoles, synchronizeMasterPlaylist);
router.post('/analyze', authorizedRoles, analyzeM3uContent); // Rota de análise adicionada
router.post('/master/create-from-parsed', authorizedRoles, createMasterPlaylistFromParsed); // Rota para salvar streams analisados
router.get('/master/streams', authorizedRoles, getMasterPlaylistStreams);
router.post('/master/streams', authorizedRoles, addMasterPlaylistStream);
router.put('/master/streams/:streamId', authorizedRoles, updateMasterPlaylistStream);
router.put('/master/streams/:id/type', authorizedRoles, updateStreamType); // Nova rota para atualizar o tipo do stream
router.delete('/master/streams/:streamId', authorizedRoles, deleteMasterPlaylistStream);
router.get('/m3u-folder-content', authorizedRoles, getM3uFilesContent);

router.route('/:id')
    .delete(authorizedRoles, deletePlaylist);

router.route('/:id/refresh')
    .post(authorizedRoles, refreshPlaylistStatus);

module.exports = router;