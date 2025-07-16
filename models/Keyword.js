const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    keyword: { type: String, required: true },
    reply: { type: String, required: true }
});

module.exports = mongoose.model('Keyword', keywordSchema);
