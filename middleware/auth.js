const jwt = require('jsonwebtoken');
require('dotenv').config();

// .env file se secret key haasil karein
const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Middleware function
module.exports = function (req, res, next) {
    // Request ke header se token haasil karein
    const token = req.header('x-auth-token');

    // Check karein ke token maujood hai ya nahi
    if (!token) {
        return res.status(401).json({ msg: 'Koi token nahi, authorization se inkaar.' });
    }

    // Token ko verify karein
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Decoded user ko request object mein add karein taake agle routes use kar sakein
        req.user = decoded;
        next(); // Agle middleware ya route par jayein
    } catch (err) {
        res.status(401).json({ msg: 'Token valid nahi hai.' });
    }
};
