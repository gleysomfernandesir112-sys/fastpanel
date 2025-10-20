const { PrismaClient, Role } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // For generating unique M3U URLs

// Get all Master Resellers
const getAllMasterResellers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: Role.MASTER_RESELLER },
      select: { id: true, username: true, createdAt: true }, // Don't send password
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};

// Create a new Master Reseller
const createMasterReseller = async (req, res) => {
  const { username, password } = req.body;
  // const creatorId = req.user.id; // From authMiddleware - assuming Super Admin for now
  const creatorId = 1; // Hardcoding Super Admin ID for now

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: Role.MASTER_RESELLER,
        createdById: creatorId,
      },
    });
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};



const getAllUsers = async (req, res) => {
  const { role } = req.query;
  const where = {};

  if (role && Role[role]) {
    where.role = Role[role];
  }

  try {
    const users = await prisma.user.findMany({
      where,
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};

const createUser = async (req, res) => {
  const { username, password, email, role } = req.body;
  const creatorId = req.user.id;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Please provide username, password, and role.' });
  }

  if (!Role[role]) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        role: Role[role],
        createdById: creatorId,
      },
    });
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};

// Update a user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  try {
    let data = { username };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, username: true, role: true },
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(500).json({ message: 'Something went wrong.', error });
  }
};


module.exports = {
  getAllUsers,      // Added
  getUserById,      // Added
  createUser,       // Added
  updateUser,
  deleteUser,
  // Specific functions we might refactor later
  getAllMasterResellers,
  createMasterReseller,
};
