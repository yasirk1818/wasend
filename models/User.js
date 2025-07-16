const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    geminiApiKey: { type: String, default: null },
    isGeminiReplyOn: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', userSchema);
