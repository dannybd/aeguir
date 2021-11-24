// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.log('Ready!');
});

const commands = require('./commands');

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) {
    console.log('Not a command!', interaction);
    return;
  }
  const command = commands[interaction.commandName];
  if (!command) {
    console.log('Missing command!', interaction);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Login to Discord with your client's token
client.login(token);
