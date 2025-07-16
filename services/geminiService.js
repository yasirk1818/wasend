const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateGeminiReply(message, apiKey) {
    if (!apiKey) {
        console.log("Gemini API key not provided.");
        return null;
    }
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const result = await model.generateContent(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I am having trouble responding right now.";
    }
}

module.exports = { generateGeminiReply };
