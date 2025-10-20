const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes below are protected
router.use(protect);

// Routes for Super Admin and Master Reseller to create users
router.post('/', restrictTo('SUPER_ADMIN', 'REVENDEDOR_MASTER'), createUser);

// Routes for Super Admin to get all users
router.get('/', restrictTo('SUPER_ADMIN'), getAllUsers);

// Routes for a specific user by ID
router
  .route('/:id')
  .get(restrictTo('SUPER_ADMIN', 'REVENDEDOR_MASTER'), getUserById)
  .put(restrictTo('SUPER_ADMIN', 'REVENDEDOR_MASTER'), updateUser)
  .delete(restrictTo('SUPER_ADMIN', 'REVENDEDOR_MASTER'), deleteUser);

module.exports = router;
