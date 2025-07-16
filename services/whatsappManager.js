const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const clients = new Map();

function createWhatsappClient(userId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId, dataPath: 'sessions' }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
    });

    client.on('qr', (qr) => {
        console.log(`QR code for user ${userId}:`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`Client for user ${userId} is ready!`);
        clients.set(userId, client);
    });

    client.on('auth_failure', () => {
        console.error(`Authentication failed for user ${userId}.`);
    });

    client.initialize();
    return client;
}

function getClient(userId) {
    return clients.get(userId);
}

module.exports = { createWhatsappClient, getClient };
