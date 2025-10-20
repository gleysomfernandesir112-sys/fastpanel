const express = require('express');
const { validateToken, registerWithToken, generateToken, generateApiToken } = require('../controllers/tokenController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/generate', protect, restrictTo('SUPER_ADMIN', 'MASTER_RESELLER'), generateToken);
router.post('/api-token', protect, restrictTo('SUPER_ADMIN'), generateApiToken);
router.get('/validate/:token', validateToken);
router.post('/register', registerWithToken);

module.exports = router;