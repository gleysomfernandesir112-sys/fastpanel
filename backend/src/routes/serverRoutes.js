const express = require('express');
const {
    getServers,
    createServer,
    updateServer,
    deleteServer,
} = require('../controllers/serverController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

const authorizedRoles = restrictTo('SUPER_ADMIN', 'MASTER_RESELLER');

router.route('/')
    .get(authorizedRoles, getServers)
    .post(authorizedRoles, createServer);

router.route('/:id')
    .put(authorizedRoles, updateServer)
    .delete(authorizedRoles, deleteServer);

module.exports = router;