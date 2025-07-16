const express = require('express');
const { createWhatsappClient } = require('../services/whatsappManager');
const authMiddleware = require('../middleware/auth'); // Ek auth middleware banayein
const router = express.Router();

// Link a new device
router.post('/link-device', authMiddleware, (req, res) => {
    const userId = req.user.userId; // auth middleware se milega
    createWhatsappClient(userId);
    res.send('QR code generate ho raha hai, terminal check karein.');
});

module.exports = router;
