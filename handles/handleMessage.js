const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const axios = require("axios");

// Load command modules (optional future commands)
const commands = new Map();
const lastImageByUser = new Map();
const prefix = '-';

fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(`../commands/${file}`);
    commands.set(command.name.toLowerCase(), command);
  });

// ✅ Gemini Vision API URL
const GEMINI_API_URL = "https://kryptonite-api-library.onrender.com/api/gemini-vision";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

// ✅ Bold font converter (for formatted AI replies)
const fontMapping = {
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
  'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
  'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
  'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
  'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
  'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
  'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
};

function convertToBold(text) {
  return text.replace(/(?:\*\*(.*?)\*\*|## (.*?)|### (.*?))/g, (match, boldText, h2Text, h3Text) => {
    const targetText = boldText || h2Text || h3Text;
    return [...targetText].map(char => fontMapping[char] || char).join('');
  });
}

// 🧠 Gemini Vision (Text + Image Analysis)
async function handleGemini(senderId, prompt, pageAccessToken, event, imageUrl) {
  if (!prompt && !imageUrl) {
    return sendMessage(senderId, { text: "❗ Please provide a question or send an image to analyze." }, pageAccessToken);
  }

  try {
    // 🔍 Get image if replying to one or attached
    if (!imageUrl) {
      if (event.message.reply_to && event.message.reply_to.mid) {
        imageUrl = await getRepliedImage(event.message.reply_to.mid, pageAccessToken);
      } else if (event.message?.attachments && event.message.attachments[0]?.type === "image") {
        imageUrl = event.message.attachments[0].payload.url;
      }
    }

    const { data } = await axios.get(GEMINI_API_URL, {
      params: { prompt, uid: senderId, imgUrl: imageUrl || "" },
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
    });

    const result = data.response || "No response from Gemini.";
    const formatted = `
💬 | 𝙶𝚎𝚖𝚒𝚗𝚒 𝚅𝚒𝚜𝚒𝚘𝚗
─────────────
${convertToBold(result)}
─────────────`;

    await sendConcatenatedMessage(senderId, formatted, pageAccessToken);

  } catch (err) {
    console.error("Gemini Error:", err);
    await sendMessage(senderId, { text: `❌ Error: ${err.message || "Something went wrong."}` }, pageAccessToken);
  }
}

// 🖼️ Get replied image from Facebook message
async function getRepliedImage(mid, pageAccessToken) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: pageAccessToken },
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
    });
    return data?.data[0]?.image_data?.url || "";
  } catch {
    throw new Error("Failed to retrieve replied image.");
  }
}

// 🔁 Split long messages for Messenger limit
async function sendConcatenatedMessage(senderId, text, pageAccessToken) {
  const maxMessageLength = 2000;
  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

// 🧹 Clear conversation
async function handleGeminiClear(senderId, pageAccessToken) {
  try {
    const { data } = await axios.get(GEMINI_API_URL, {
      params: { prompt: "clear", uid: senderId },
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
    });

    const message = data.response || "🧹 Gemini conversation cleared successfully.";
    await sendMessage(senderId, { text: message }, pageAccessToken);
  } catch (err) {
    console.error("Gemini Clear Error:", err);
    await sendMessage(senderId, { text: "❌ Failed to clear Gemini conversation." }, pageAccessToken);
  }
}

// 📩 Main message handler
async function handleMessage(event, pageAccessToken, recordCommandUsage) {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim();
  const attachments = event?.message?.attachments || [];

  // 🖼️ Check if message has image attachment
  const imageAttachment = attachments.find(a => a.type === 'image');
  const imageUrl = imageAttachment?.payload?.url;

  // ✅ Remember the last sent image for analyzing
  if (imageUrl) {
    lastImageByUser.set(senderId, imageUrl);
  }

  const lastImage = lastImageByUser.get(senderId);

  if (!messageText) {
    // If only image sent → Analyze automatically
    if (lastImage) {
      await handleGemini(senderId, "", pageAccessToken, event, lastImage);
      lastImageByUser.delete(senderId);
    }
    return;
  }

  // 🧹 Clear conversation command
  if (messageText.toLowerCase() === "clear") {
    await handleGeminiClear(senderId, pageAccessToken);
    return;
  }

  const [rawCommand, ...args] = messageText.startsWith(prefix)
    ? messageText.slice(prefix.length).split(' ')
    : messageText.split(' ');

  const commandKey = rawCommand.toLowerCase();

  try {
    console.log(`Received command: ${commandKey}, args: ${args.join(' ')}`);

    // ✅ Gemini command (manual)
    if (commandKey === 'gemini') {
      if (recordCommandUsage) recordCommandUsage(commandKey);
      await handleGemini(senderId, args.join(" "), pageAccessToken, event, lastImage);
      lastImageByUser.delete(senderId);
      return;
    }

    // ✅ Default fallback → Gemini Vision (conversation mode)
    await handleGemini(senderId, messageText, pageAccessToken, event, lastImage);

  } catch (error) {
    console.error(`Error executing command "${commandKey}":`, error);
    await sendMessage(senderId, {
      text: error.message || `❌ There was an error executing "${commandKey}".`
    }, pageAccessToken);
  }
}

module.exports = { handleMessage };
