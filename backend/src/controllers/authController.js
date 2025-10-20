const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const register = async (req, res) => {
    const { username, password, role, createdById } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Please provide username, password, and role.' });
    }

    if (role === 'SUPER_ADMIN') {
        const adminExists = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' },
        });
        if (adminExists) {
            return res.status(403).json({ message: 'A Super Admin already exists.' });
        }
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
                createdById: createdById ? parseInt(createdById) : null,
            },
        });
        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        res.status(500).json({ message: 'Something went wrong.', error });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    try {
        // CORRE��O: For�a o Prisma a retornar o campo 'password' para que o bcrypt possa compar�-lo.
        const user = await prisma.user.findUnique({ 
            where: { username },
            select: { 
                id: true, 
                username: true, 
                password: true, // <<< CORRE��O PRINCIPAL AQUI
                role: true 
            } 
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Gera o token JWT. Usamos 'userId' para compatibilidade com o authMiddleware.
        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ token });
    } catch (error) {
        // Agora, este catch s� pegar� erros internos reais, n�o a falha de password.
        console.error('Login error:', error);
        res.status(500).json({ message: 'Something went wrong.', error });
    }
};

module.exports = {
    register,
    login,
};