const {
  bustCache,
  getConfig,
  isMod,
} = require('../common.js');
const {MessageEmbed} = require('discord.js');

const EMOJIS = ['⏸', '🛑'];

module.exports = {
  setup: (client) => {
    client.on('messageCreate', async (message) => {
      if (message.partial) {
        try {
          await message.fetch();
        } catch (error) {
          console.error(error);
          return;
        }
      }
      if (message.content.toLowerCase() !== 'aeguir reload') {
        return;
      }
      const {member, guild} = message;
      if (!guild) {
        return;
      }
      if (!member) {
        return;
      }
      if (member.partial) {
        try {
          await member.fetch();
        } catch (error) {
          console.error(error);
          return;
        }
      }
      if (member?.user?.bot) {
        return;
      }
      if (!isMod(member)) {
        return;
      }
      const newCacheVal = bustCache(guild);
      await message.reply(`Cache index now = ${newCacheVal}`);
    });
  },
};
