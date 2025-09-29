const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'fbshield',
  description: 'Toggle Facebook Profile Shield using access token.',
  usage: 'fbshield <token eaaau> | <on/off>',
  category: 'tools',
  author: 'Ryy',
  async execute(senderId, args, pageAccessToken) {
    const input = args.join(' ').split('|').map(x => x.trim());

    if (input.length < 2) {
      return sendMessage(senderId, {
        text: '❗ 𝗨𝘀𝗮𝗴𝗲:\nfbshield <token eaaau> | <on/off>\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲:\nfbshield EAA...ZDZD | on'
      }, pageAccessToken);
    }

    const [token, toggle] = input;
    const enable = toggle.toLowerCase() === 'on' ? 'true' :
                   toggle.toLowerCase() === 'off' ? 'false' : null;

    if (!enable) {
      return sendMessage(senderId, {
        text: '❌ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝘁𝗼𝗴𝗴𝗹𝗲 𝘃𝗮𝗹𝘂𝗲. 𝗨𝘀𝗲 `on` 𝗼𝗿 `off`.'
      }, pageAccessToken);
    }

    const apiUrl = `https://wrapped-rest-apis.vercel.app/api/guard?token=${encodeURIComponent(token)}&enable=${enable}`;

    try {
      const res = await axios.get(apiUrl);
      const { result } = res.data;

      if (result?.success) {
        return sendMessage(senderId, {
          text: `🛡️ 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗦𝗵𝗶𝗲𝗹𝗱 ${enable === 'true' ? '𝗲𝗻𝗮𝗯𝗹𝗲𝗱' : '𝗱𝗶𝘀𝗮𝗯𝗹𝗲𝗱'} 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆.`
        }, pageAccessToken);
      } else {
        return sendMessage(senderId, {
          text: '❌ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝘂𝗽𝗱𝗮𝘁𝗲 𝗽𝗿𝗼𝗳𝗶𝗹𝗲 𝘀𝗵𝗶𝗲𝗹𝗱. 𝗠𝗮𝗸𝗲 𝘀𝘂𝗿𝗲 𝘁𝗵𝗲 𝘁𝗼𝗸𝗲𝗻 𝗶𝘀 𝘃𝗮𝗹𝗶𝗱.'
        }, pageAccessToken);
      }
    } catch (error) {
      console.error('fbshield error:', error.message);
      return sendMessage(senderId, {
        text: `❌ 𝗘𝗿𝗿𝗼𝗿: ${error.message}`
      }, pageAccessToken);
    }
  }
};