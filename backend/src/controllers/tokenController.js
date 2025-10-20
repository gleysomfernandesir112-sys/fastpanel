const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Generate a registration token
// @route   POST /tokens/generate
// @access  Private (Super Admin or Master Reseller)
const generateToken = async (req, res) => {
    const { role, daysValid } = req.body;
    const creatorId = req.user.id;

    if (!role) {
        return res.status(400).json({ message: 'Role is required.' });
    }

    try {
        const token = crypto.randomBytes(20).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (daysValid || 7)); // Default to 7 days

        const newRegistrationToken = await prisma.registrationToken.create({
            data: {
                token,
                role,
                expiresAt,
                createdById: creatorId,
            },
        });

        res.status(201).json({ message: 'Token generated successfully!', token: newRegistrationToken.token });

    } catch (error) {
        console.error("Erro ao gerar token:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// @desc    Generate an API token
// @route   POST /tokens/api-token
// @access  Private (Super Admin)
const generateApiToken = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet.' });
};

// @desc    Validate a registration token
// @route   GET /tokens/validate/:token
// @access  Public
const validateToken = async (req, res) => {
    const { token } = req.params;

    try {
        const registrationToken = await prisma.registrationToken.findUnique({
            where: { token },
        });

        if (!registrationToken) {
            return res.status(404).json({ message: 'Token não encontrado.' });
        }

        if (registrationToken.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Token expirado.' });
        }

        if (registrationToken.usedAt) {
            return res.status(400).json({ message: 'Token já utilizado.' });
        }

        res.status(200).json({ message: 'Token válido.', role: registrationToken.role });
    } catch (error) {
        console.error("Erro ao validar token:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// @desc    Register a new user using a valid token
// @route   POST /tokens/register
// @access  Public
const registerWithToken = async (req, res) => {
    const { token, username, email, password, whatsapp } = req.body;

    if (!token || !username || !password) {
        return res.status(400).json({ message: 'Token, nome de usuário e senha são obrigatórios.' });
    }

    try {
        const registrationToken = await prisma.registrationToken.findUnique({
            where: { token },
        });

        if (!registrationToken) {
            return res.status(404).json({ message: 'Token não encontrado.' });
        }

        if (registrationToken.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Token expirado.' });
        }

        if (registrationToken.usedAt) {
            return res.status(400).json({ message: 'Token já utilizado.' });
        }

        // Token é válido e não usado, prosseguir com o registro
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: registrationToken.role, // Usa a role do token
                whatsapp,
                createdById: registrationToken.createdById, // Associa ao criador do token
            },
        });

        // Marcar o token como usado
        await prisma.registrationToken.update({
            where: { id: registrationToken.id },
            data: { usedAt: new Date() },
        });

        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: newUser.id });

    } catch (error) {
        console.error("Erro ao registrar com token:", error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Nome de usuário ou email já existem.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    generateToken,
    generateApiToken,
    validateToken,
    registerWithToken,
};