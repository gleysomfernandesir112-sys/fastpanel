const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// @desc    Get all clients for the logged-in user
// @route   GET /api/clients
// @access  Private (RESELLER, MASTER_RESELLER)
const getClients = async (req, res) => {
  const resellerId = req.user.id;

  try {
    const clients = await prisma.client.findMany({
      where: { resellerId },
      select: { id: true, username: true, m3uUrl: true, expirationDate: true, createdAt: true },
    });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong fetching clients.', error });
  }
};

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private (RESELLER, MASTER_RESELLER)
const createClient = async (req, res) => {
  const { username, password, expiration, playlistIds } = req.body; // Added playlistIds
  const resellerId = req.user.id;

  if (!username || !password || expiration === undefined) {
    return res.status(400).json({ message: 'Please provide username, password, and expiration.' });
  }

  if (!playlistIds || !Array.isArray(playlistIds) || playlistIds.length === 0) {
    return res.status(400).json({ message: 'Please select at least one source playlist.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let expirationDate = null;

    if (parseInt(expiration) !== 0) { // 0 means Lifetime
      expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + parseInt(expiration));
    }

    const newClient = await prisma.client.create({
      data: {
        username,
        password: hashedPassword,
        expirationDate,
        reseller: {
          connect: { id: resellerId },
        },
        sourcePlaylists: {
          connect: playlistIds.map(id => ({ id: parseInt(id) })),
        },
      },
    });

    // Add job to queue for M3U generation
    const jobData = {
      clientId: newClient.id,
      username: newClient.username,
    };
    const jobFilePath = `C:/Users/Andre/Downloads/Teste/backend/queue/new-clients/${newClient.id}.json`;
    await fs.promises.writeFile(jobFilePath, JSON.stringify(jobData));

    res.status(201).json(newClient);
  } catch (error) {
    console.error("Client creation error:", error); // Added for better debugging
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Client username already exists.' });
    }
    // Prisma error for connecting to a non-existent record
    if (error.code === 'P2025') {
        return res.status(400).json({ message: 'One or more of the selected playlists does not exist.' });
    }
    res.status(500).json({ message: 'Something went wrong creating the client.', error });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private (RESELLER, MASTER_RESELLER)
const deleteClient = async (req, res) => {
  const { id } = req.params;
  const resellerId = req.user.id;

  try {
    const client = await prisma.client.findFirst({
      where: { id: parseInt(id), resellerId },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found or you do not have permission to delete it.' });
    }

    await prisma.client.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong deleting the client.', error });
  }
};

// @desc    Reset a client's password
// @route   PUT /api/clients/:id/reset-password
// @access  Private (RESELLER, MASTER_RESELLER)
const resetClientPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const resellerId = req.user.id;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password cannot be empty.' });
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id: parseInt(id), resellerId },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found or you do not have permission to modify it.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.client.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong resetting the password.', error });
  }
};

// @desc    Renew a client's subscription
// @route   PUT /api/clients/:id/renew
// @access  Private (RESELLER, MASTER_RESELLER)
const renewClient = async (req, res) => {
  const { id } = req.params;
  const { expiration } = req.body; // expiration in months
  const resellerId = req.user.id;

  if (expiration === undefined || isNaN(parseInt(expiration))) {
    return res.status(400).json({ message: 'Please provide a valid expiration duration in months.' });
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id: parseInt(id), resellerId },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found or you do not have permission to renew it.' });
    }

    let newExpirationDate = client.expirationDate || new Date(); // If no existing date, start from now
    if (parseInt(expiration) === 0) { // 0 means Lifetime
      newExpirationDate = null; // Set to null for lifetime
    } else {
      newExpirationDate = new Date(newExpirationDate);
      newExpirationDate.setMonth(newExpirationDate.getMonth() + parseInt(expiration));
    }

    const updatedClient = await prisma.client.update({
      where: { id: parseInt(id) },
      data: { expirationDate: newExpirationDate },
    });

    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong renewing the client.', error });
  }
};

module.exports = {
  getClients,
  createClient,
  deleteClient,
  resetClientPassword,
  renewClient,
};
