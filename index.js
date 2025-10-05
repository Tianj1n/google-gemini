const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();
const COMMANDS_PATH = path.join(__dirname, 'commands');
const USAGE_LOG_PATH = path.join(__dirname, 'usageLogs.json');

if (!fs.existsSync(USAGE_LOG_PATH)) {
  fs.writeFileSync(USAGE_LOG_PATH, JSON.stringify({}, null, 2));
}

function loadUsageLogs() {
  if (!fs.existsSync(USAGE_LOG_PATH)) return {};
  return JSON.parse(fs.readFileSync(USAGE_LOG_PATH, 'utf8'));
}

function saveUsageLogs(logs) {
  fs.writeFileSync(USAGE_LOG_PATH, JSON.stringify(logs, null, 2));
}

function recordCommandUsage(commandName) {
  const logs = loadUsageLogs();
  const now = new Date().toLocaleString("en-PH", { hour12: false });

  if (!logs[commandName]) {
    logs[commandName] = { count: 1, last_used: now };
  } else {
    logs[commandName].count += 1;
    logs[commandName].last_used = now;
  }

  saveUsageLogs(logs);
  console.log(`📈 Command used: ${commandName} (${logs[commandName].count}x)`);
}

const startTime = Date.now();

function formatUptime(ms) {
  let sec = Math.floor(ms / 1000);
  const years = Math.floor(sec / (365 * 24 * 3600));
  sec %= (365 * 24 * 3600);
  const months = Math.floor(sec / (30 * 24 * 3600));
  sec %= (30 * 24 * 3600);
  const days = Math.floor(sec / (24 * 3600));
  sec %= (24 * 3600);
  const hours = Math.floor(sec / 3600);
  sec %= 3600;
  const minutes = Math.floor(sec / 60);
  sec %= 60;
  return { years, months, days, hours, minutes, seconds: sec };
}

function getPHTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const phTime = new Date(utc + (8 * 3600000));
  return phTime.toLocaleString("en-PH", { hour12: false }) + " (GMT +8)";
}

app.get('/api/uptime', (req, res) => {
  const uptimeData = formatUptime(Date.now() - startTime);
  res.json({
    status: "Active ✅",
    uptime: uptimeData,
    current_time: getPHTime()
  });
});

app.get('/api/usage', (req, res) => {
  const logs = loadUsageLogs();

  const sorted = Object.entries(logs)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([command, data], index) => ({
      rank: index + 1,
      command,
      count: data.count,
      last_used: data.last_used
    }));

  res.json({
    total_commands: Object.keys(logs).length,
    top_commands: sorted.slice(0, 10)
  });
});

app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  res.sendStatus(400);
});

app.post('/webhook', (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      entry.messaging?.forEach(event => {
        if (event.message) {
          handleMessage(event, PAGE_ACCESS_TOKEN, recordCommandUsage);
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN);
        }
      });
    });

    return res.status(200).send('EVENT_RECEIVED');
  }

  res.sendStatus(404);
});

const sendMessengerProfileRequest = async (method, url, data = null) => {
  try {
    const response = await axios({
      method,
      url: `https://graph.facebook.com/v21.0${url}?access_token=${PAGE_ACCESS_TOKEN}`,
      headers: { 'Content-Type': 'application/json' },
      data
    });
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} request:`, error.response?.data || error.message);
    throw error;
  }
};

const loadCommands = () => {
  return fs.readdirSync(COMMANDS_PATH)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const command = require(path.join(COMMANDS_PATH, file));
      return command.name && command.description
        ? { name: command.name, description: command.description }
        : null;
    })
    .filter(Boolean);
};

const loadMenuCommands = async (isReload = false) => {
  const commands = loadCommands();

  if (isReload) {
    await sendMessengerProfileRequest('delete', '/me/messenger_profile', { fields: ['commands'] });
    console.log('Menu commands deleted successfully.');
  }

  await sendMessengerProfileRequest('post', '/me/messenger_profile', {
    commands: [{ locale: 'default', commands }],
  });

  console.log('Menu commands loaded successfully.');
};

fs.watch(COMMANDS_PATH, (eventType, filename) => {
  if (['change', 'rename'].includes(eventType) && filename.endsWith('.js')) {
    loadMenuCommands(true).catch(error => {
      console.error('Error reloading menu commands:', error);
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ Server is running on port ${PORT}`);
  try {
    await loadMenuCommands();
  } catch (error) {
    console.error('Error loading initial menu commands:', error);
  }
});

module.exports = { recordCommandUsage };