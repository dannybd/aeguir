const glob = require('glob');
const path = require('path');

const {Client, Intents} = require('discord.js');
const {token} = require('./config.json');

// Create a new client instance
const client = new Client({
  intents: [
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILDS,
  ],
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.log('Ready!');
});

console.log('Loading extensions...');
glob.sync('./extensions/*.js').forEach(file => {
  try {
    console.log(`Loading ${file}`);
    require(path.resolve(file));
  } catch (error) {
    console.error(`Failed to load extension ${file}`, error);
  }
});

// Login to Discord with your client's token
console.log('Starting!');
client.login(token);
