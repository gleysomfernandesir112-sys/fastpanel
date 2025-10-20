const express = require('express');
const {
  getDashboardStats,
  getDashboardSettings,
  updateDashboardSettings,
} = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all dashboard routes
router.use(protect);

// Stats are available to admins and resellers
router.get('/stats', restrictTo('SUPER_ADMIN', 'MASTER_RESELLER'), getDashboardStats);

// Settings are only available to the Super Admin
router.get('/settings', restrictTo('SUPER_ADMIN'), getDashboardSettings);
router.put('/settings', restrictTo('SUPER_ADMIN'), updateDashboardSettings);

module.exports = router;
