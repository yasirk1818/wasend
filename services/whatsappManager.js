// /services/whatsappManager.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');

// Models ko import karein
const User = require('../models/User');
const Keyword = require('../models/Keyword');
const { generateGeminiReply } = require('./geminiService'); // Gemini service se function import karein

// Sabhi active clients ko store karne ke liye
const activeClients = new Map();

/**
 * Ek naya WhatsApp client banata aur initialize karta hai
 * @param {string} userId - User ki MongoDB ID
 */
function createWhatsappClient(userId) {
    console.log(`User ${userId} ke liye client banane ki koshish...`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: userId,
            dataPath: 'sessions' // Sessions save karne ke liye folder
        }),
        puppeteer: {
            headless: true, // Server par run karne ke liye true rakhein
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Heroku/VPS ke liye
                '--disable-gpu'
            ],
        },
        // Client restart hone par purane messages ko handle karne se rokein
        qrMaxRetries: 1, 
    });

    // QR Code Event
    client.on('qr', (qr) => {
        console.log(`USER [${userId}] - QR Code mila, terminal par display ho raha hai:`);
        // Terminal par QR code dikhayein
        qrcode.generate(qr, { small: true });
        // Aap is QR ko frontend par bhi bhej sakte hain
    });

    // Ready Event
    client.on('ready', () => {
        console.log(`USER [${userId}] - Client taiyar hai!`);
        activeClients.set(userId, client);
    });

    // Authentication Failure Event
    client.on('auth_failure', (msg) => {
        console.error(`USER [${userId}] - Authentication fail ho gayi:`, msg);
        // Yahan session file delete karne ka logic add kar sakte hain
    });

    // Disconnected Event
    client.on('disconnected', (reason) => {
        console.log(`USER [${userId}] - Client disconnect ho gaya:`, reason);
        activeClients.delete(userId);
    });

    // Message Listener Event
    client.on('message_create', async (message) => {
        // Sirf dusron ke messages par reply karein, apne nahi
        if (message.fromMe) return;

        try {
            const user = await User.findById(userId);
            if (!user) return; // Agar user database mein nahi milta

            // 1. Keyword-based reply check karein
            const userKeywords = await Keyword.find({ userId: mongoose.Types.ObjectId(userId) });
            for (const item of userKeywords) {
                // Keyword ko case-insensitive banayein
                if (message.body.toLowerCase().includes(item.keyword.toLowerCase())) {
                    console.log(`USER [${userId}] - Keyword "${item.keyword}" match hua. Jawab bheja ja raha hai.`);
                    await client.sendMessage(message.from, item.reply);
                    return; // Keyword milne par process rok dein
                }
            }

            // 2. Agar keyword match na ho to Gemini reply check karein
            if (user.isGeminiReplyOn) {
                const apiKey = user.geminiApiKey || process.env.DEFAULT_GEMINI_API_KEY;
                if (!apiKey) {
                    console.log(`USER [${userId}] - Gemini reply on hai lekin API key nahi hai.`);
                    return;
                }

                console.log(`USER [${userId}] - Koi keyword match nahi hua. Gemini se jawab banaya ja raha hai...`);
                const geminiReply = await generateGeminiReply(message.body, apiKey);
                if (geminiReply) {
                    await client.sendMessage(message.from, geminiReply);
                }
            }
        } catch (error) {
            console.error(`USER [${userId}] - Message handle karte waqt error:`, error);
        }
    });

    client.initialize().catch(err => {
        console.error(`USER [${userId}] - Client initialize nahi ho saka:`, err);
    });

    return client;
}

/**
 * Active client haasil karein
 * @param {string} userId
 * @returns {Client | undefined}
 */
function getClient(userId) {
    return activeClients.get(userId);
}

/**
 * Client ko destroy aur remove karein
 * @param {string} userId
 */
async function removeClient(userId) {
    const client = getClient(userId);
    if (client) {
        await client.destroy();
        activeClients.delete(userId);
        console.log(`USER [${userId}] - Client सफलतापूर्वक remove kar diya gaya.`);
    }
}

module.exports = {
    createWhatsappClient,
    getClient,
    removeClient
};
