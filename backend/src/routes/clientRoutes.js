const express = require('express');
const {
  getClients,
  createClient,
  deleteClient,
  resetClientPassword,
  renewClient,
} = require('../controllers/clientController.js');
const { protect, restrictTo } = require('../middlewares/authMiddleware.js');

const router = express.Router();

// All routes in this file are protected and restricted
router.use(protect);
router.use(restrictTo('SUPER_ADMIN', 'MASTER_RESELLER', 'RESELLER'));

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .delete(deleteClient);

router.route('/:id/reset-password')
  .put(resetClientPassword);

router.route('/:id/renew')
  .put(renewClient);

module.exports = router;
