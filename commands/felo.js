const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'felo',
  description: 'Ask Felo AI anything!',
  usage: 'felo <your question>',
  category: 'ai',
  author: 'Kyuu',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      return sendMessage(senderId, {
        text: "⚠️ Please provide a prompt.\n\nExample: hello"
      }, pageAccessToken);
    }

    const prompt = args.join(" ");

    await sendMessage(senderId, {
      text: `🤖 Felo AI is thinking..`
    }, pageAccessToken);

    try {
      const response = await axios.get(`https://api.ferdev.my.id/ai/felo?prompt=${encodeURIComponent(prompt)}&apikey=lain-lain`, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = response.data;

      if (!data || !data.message) {
        return sendMessage(senderId, {
          text: "🥺 Sorry, I didn't get a response from Felo AI. Try again."
        }, pageAccessToken);
      }

      const message = 
        `𝗙𝗲𝗹𝗼 𝗔𝗜 \n` +
        `─────────────\n` +
        `${data.message}`;

      await sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error('Felo AI command error:', error.message);
      await sendMessage(senderId, {
        text: `❌ An error occurred: ${error.message}`
      }, pageAccessToken);
    }
  }
};