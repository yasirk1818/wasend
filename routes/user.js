const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Middleware: Is route ki sabhi requests ke liye authentication zaroori hai
router.use(authMiddleware);

// GET /api/user/me
// Logged-in user ki details haasil karein
router.get('/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // Password ko chhod kar sab kuch select karein
        if (!user) {
            return res.status(404).json({ message: 'User nahi mila.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// PUT /api/user/gemini-key
// User ki Gemini API key ko update karein
router.put('/gemini-key', async (req, res) => {
    const { apiKey } = req.body;

    if (typeof apiKey !== 'string') {
        return res.status(400).json({ message: 'Valid API key zaroori hai.' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { geminiApiKey: apiKey },
            { new: true } // Update hone ke baad naya document return karein
        ).select('-password');
        
        res.status(200).json({ message: 'Gemini API Key सफलतापूर्वक update ho gayi.', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Update karte waqt error aayi.', error: error.message });
    }
});

// PUT /api/user/gemini-toggle
// Gemini auto-reply ko on ya off karein
router.put('/gemini-toggle', async (req, res) => {
    const { enable } = req.body;

    if (typeof enable !== 'boolean') {
        return res.status(400).json({ message: 'Enable ki value true ya false honi chahiye.' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { isGeminiReplyOn: enable },
            { new: true }
        ).select('-password');
        
        res.status(200).json({
            message: `Gemini replies ab ${enable ? 'ON' : 'OFF'} hain.`,
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Toggle karte waqt error aayi.', error: error.message });
    }
});

module.exports = router;```
