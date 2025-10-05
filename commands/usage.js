const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'usage',
  description: 'Show total and top used commands.',
  usage: 'usage',
  category: 'system',
  author: 'Chatbot System',

  async execute(senderId, args, pageAccessToken) {
    try {
      const response = await axios.get('YOUR_URL/api/usage');
      const data = response.data;

      if (!data || !data.total_commands || !data.top_commands) {
        return sendMessage(senderId, {
          text: "🥺 𝗦𝗼𝗿𝗿𝘆, 𝗜 𝗰𝗼𝘂𝗹𝗱𝗻’𝘁 𝗿𝗲𝘁𝗿𝗶𝗲𝘃𝗲 𝘂𝘀𝗮𝗴𝗲 𝗱𝗮𝘁𝗮."
        }, pageAccessToken);
      }

      const { total_commands, top_commands } = data;

      // Format top commands list
      const topList = top_commands
        .map(cmd => 
          `#${cmd.rank} ➤ ${cmd.command}\n` +
          `   🧮 Used: ${cmd.count}x\n` +
          `   🕒 Last: ${cmd.last_used}`
        )
        .join('\n\n');

      const message =
        `📊 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗨𝘀𝗮𝗴𝗲 𝗦𝘁𝗮𝘁𝘀\n` +
        `──────────────\n` +
        `🧾 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${total_commands}\n\n` +
        `🏆 𝗧𝗼𝗽 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀\n${topList}`;

      await sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error('Usage command error:', error.message);
      await sendMessage(senderId, {
        text: `❌ 𝗔𝗻 𝗲𝗿𝗿𝗼𝗿 𝗼𝗰𝗰𝘂𝗿𝗿𝗲𝗱: ${error.message}`
      }, pageAccessToken);
    }
  }
};