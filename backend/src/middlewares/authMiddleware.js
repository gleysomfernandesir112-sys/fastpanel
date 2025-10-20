const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Middleware to protect routes by verifying JWT
const protect = async (req, res, next) => {
    let token;
    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // CORRE��O: Encontre o usu�rio pelo ID do token payload.
        // Assumimos que o payload do token usa 'userId'.
        const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } }); // <<< AQUI EST� A CORRE��O

        if (!currentUser) {
            return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        // Inclui log para debug
        console.error('JWT Verification Error (Failed to authenticate):', error.message); 
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['SUPER_ADMIN', 'MASTER_RESELLER']
        // req.user.role is available from the 'protect' middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo,
};