const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'uptime',
  description: 'Check bot uptime and current server time.',
  usage: 'uptime',
  category: 'system',
  author: 'Chatbot System',

  async execute(senderId, args, pageAccessToken) {
    try {
      const response = await axios.get('YOUR_URL/api/uptime');
      const data = response.data;

      if (!data || !data.uptime) {
        return sendMessage(senderId, {
          text: "🥺 𝗦𝗼𝗿𝗿𝘆, 𝗜 𝗰𝗼𝘂𝗹𝗱𝗻’𝘁 𝗿𝗲𝘁𝗿𝗶𝗲𝘃𝗲 𝘂𝗽𝘁𝗶𝗺𝗲 𝗶𝗻𝗳𝗼."
        }, pageAccessToken);
      }

      const { status, uptime, current_time } = data;
      const { years, months, days, hours, minutes, seconds } = uptime;

      // Line-by-line uptime breakdown
      const uptimeBreakdown =
        `${seconds} Second(s)\n` +
        `${minutes} Minute(s)\n` +
        `${hours} Hour(s)\n` +
        `${days} Day(s)\n` +
        `${months} Month(s)\n` +
        `${years} Year(s)`;

      const message =
        `📡 𝗨𝗽𝘁𝗶𝗺𝗲 𝗦𝘁𝗮𝘁𝘂𝘀\n` +
        `─────────────\n` +
        `🪪 𝗠𝗰𝘅𝘃 𝗔𝗜\n` +
        `💻 𝗛𝗼𝘀𝘁𝗶𝗻𝗴 𝘀𝗶𝘁𝗲: https://render.com/\n` +
        `🟢 𝗦𝘁𝗮𝘁𝘂𝘀: ${status}\n\n` +
        `⏱️ 𝗨𝗽𝘁𝗶𝗺𝗲\n${uptimeBreakdown}\n\n` +
        `🕒 𝗔𝘀𝗶𝗮/𝗠𝗮𝗻𝗶𝗹𝗮: ${current_time}`;

      await sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error('Uptime command error:', error.message);
      await sendMessage(senderId, {
        text: `❌ 𝗔𝗻 𝗲𝗿𝗿𝗼𝗿 𝗼𝗰𝗰𝘂𝗿𝗿𝗲𝗱: ${error.message}`
      }, pageAccessToken);
    }
  }
};