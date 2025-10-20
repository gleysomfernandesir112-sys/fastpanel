const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// @desc    Get all servers for the authenticated user
// @route   GET /api/servers
// @access  Private
const getServers = async (req, res) => {
    try {
        const servers = await prisma.server.findMany({
            where: { ownerId: req.user.id },
            orderBy: { name: 'asc' },
        });
        res.status(200).json(servers);
    } catch (error) {
        console.error("Error in getServers:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Create a new server
// @route   POST /api/servers
// @access  Private
const createServer = async (req, res) => {
    const { name, url, isDefault } = req.body;

    if (!name || !url) {
        return res.status(400).json({ message: 'Name and URL are required.' });
    }

    try {
        // If this new server is set as default, unset default for any other server
        if (isDefault) {
            await prisma.server.updateMany({
                where: { ownerId: req.user.id, isDefault: true },
                data: { isDefault: false },
            });
        }

        const newServer = await prisma.server.create({
            data: {
                name,
                url,
                isDefault: isDefault || false,
                ownerId: req.user.id,
            },
        });
        res.status(201).json(newServer);
    } catch (error) {
        console.error("Error in createServer:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Update a server
// @route   PUT /api/servers/:id
// @access  Private
const updateServer = async (req, res) => {
    const { id } = req.params;
    const { name, url, isDefault } = req.body;

    if (!name || !url) {
        return res.status(400).json({ message: 'Name and URL are required.' });
    }

    try {
        // If this server is set as default, unset default for any other server
        if (isDefault) {
            await prisma.server.updateMany({
                where: { ownerId: req.user.id, isDefault: true, id: { not: parseInt(id) } },
                data: { isDefault: false },
            });
        }

        const updatedServer = await prisma.server.update({
            where: { id: parseInt(id) },
            data: {
                name,
                url,
                isDefault: isDefault || false,
            },
        });
        res.status(200).json(updatedServer);
    } catch (error) {
        console.error("Error in updateServer:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Delete a server
// @route   DELETE /api/servers/:id
// @access  Private
const deleteServer = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.server.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error in deleteServer:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getServers,
    createServer,
    updateServer,
    deleteServer,
};