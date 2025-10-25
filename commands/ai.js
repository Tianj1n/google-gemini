const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

let fontEnabled = true;

function formatFont(text) {
  const fontMapping = {
    a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆",
    n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋", s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
    A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬",
    N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱", S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹"
  };

  return [...text].map(char => fontEnabled && fontMapping[char] ? fontMapping[char] : char).join('');
}

module.exports = {
  name: "advice",
  description: "Get a random piece of advice",
  usage: "say advice",
  category: "others",
  author: "Tianji",
  async execute(senderId, args, pageAccessToken) {
    await sendMessage(senderId, {
      text: formatFont("⌛ Fetching a piece of advice...")
    }, pageAccessToken);

    try {
      const response = await axios.get("https://api-sentinels-3e5w.onrender.com/api/advice");
      const advice = response.data?.advice;

      if (!advice) {
        await sendMessage(senderId, {
          text: formatFont("😔 Couldn't fetch any advice.")
        }, pageAccessToken);
        return;
      }

      await sendMessage(senderId, {
        text: formatFont(`💡 Advice\n\n"${advice}"`)
      }, pageAccessToken);
    } catch (error) {
      console.error("advice command error:", error.message);
      await sendMessage(senderId, {
        text: formatFont(`❌ Error: ${error.message}`)
      }, pageAccessToken);
    }
  }
};
