const { verifyToken } = require('../auth/token');

function authWare(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ 
            error: 'Invalid authorization format' });
    }

    const token = parts[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ 
            error: 'Invalid or expired token' });
    }
}

module.exports = authWare;