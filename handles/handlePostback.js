const axios = require('axios');
const { sendMessage } = require('./sendMessage');

const handlePostback = async (event, pageAccessToken) => {
  const { id: senderId } = event.sender || {};
  const { payload } = event.postback || {};

  if (!senderId || !payload) return console.error('Invalid postback event object');

  try {
    // Send updated Terms of Service & Privacy Policy text
    await sendMessage(senderId, {
      text: `Hello, Welcome to Google Gemini AI, ask me anything or provide image.`
    }, pageAccessToken);

  } catch (err) {
    console.error('Error handling postback:', err.message || err);
  }
};

module.exports = { handlePostback }; 