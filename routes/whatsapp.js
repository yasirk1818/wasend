const express = require('express');
const { createWhatsappClient, removeClient, getClient } = require('../services/whatsappManager');
const authMiddleware = require('../middleware/auth'); // Maan lein ke aapne JWT ke liye auth middleware banaya hai
const Keyword = require('../models/Keyword');
const router = express.Router();

// Middleware: Is route ki sabhi requests ke liye authentication zaroori hai
router.use(authMiddleware);

// POST /api/whatsapp/link-device
// Ek naye device ko link karne ke liye QR code generate karein
router.post('/link-device', (req, res) => {
    const userId = req.user.userId; // auth middleware se user ID milti hai
    
    // Agar client pehle se chal raha hai to error bhejें
    if (getClient(userId)) {
        return res.status(400).json({ message: 'Device is already linked and running.' });
    }

    try {
        createWhatsappClient(userId);
        res.status(202).json({ message: 'Device link karne ka process shuru ho gaya hai. QR code ke liye server logs check karein.' });
    } catch (error) {
        res.status(500).json({ message: 'Client banane mein error aayi.', error: error.message });
    }
});

// POST /api/whatsapp/remove-device
// Link kiye gaye device ko logout aur remove karein
router.post('/remove-device', async (req, res) => {
    const userId = req.user.userId;

    if (!getClient(userId)) {
        return res.status(404).json({ message: 'Koi linked device nahi mila.' });
    }

    try {
        await removeClient(userId);
        // Yahan aap session folder ko bhi delete kar sakte hain
        res.status(200).json({ message: 'Device सफलतापूर्वक remove kar diya gaya.' });
    } catch (error) {
        res.status(500).json({ message: 'Device remove karte waqt error aayi.', error: error.message });
    }
});

// --- Keywords Management Routes ---

// POST /api/whatsapp/keywords
// Naya keyword aur reply add karein
router.post('/keywords', async (req, res) => {
    const { keyword, reply } = req.body;
    if (!keyword || !reply) {
        return res.status(400).json({ message: 'Keyword aur reply dono zaroori hain.' });
    }

    const newKeyword = new Keyword({
        userId: req.user.userId,
        keyword,
        reply
    });

    await newKeyword.save();
    res.status(201).json({ message: 'Keyword सफलतापूर्वक add ho gaya.', keyword: newKeyword });
});

// GET /api/whatsapp/keywords
// User ke sabhi keywords haasil karein
router.get('/keywords', async (req, res) => {
    const keywords = await Keyword.find({ userId: req.user.userId });
    res.status(200).json(keywords);
});

// DELETE /api/whatsapp/keywords/:id
// Ek keyword ko uski ID se delete karein
router.delete('/keywords/:id', async (req, res) => {
    const { id } = req.params;
    const keyword = await Keyword.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!keyword) {
        return res.status(404).json({ message: 'Is ID ke saath koi keyword nahi mila.' });
    }

    res.status(200).json({ message: 'Keyword सफलतापूर्वक delete ho gaya.' });
});

module.exports = router;
