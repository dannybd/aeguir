const {getConfig, log, printUser} = require('../common.js');

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
      if (!/\b\+tempcheck\b/.test(message.content.toLowerCase())) {
        return;
      }
      const actor = message.member?.user;
      if (!actor) {
        return;
      }
      const {channel, guild} = message;
      if (!guild) {
        return;
      }
      const config = getConfig(guild);
      if (config['ignored_channels'].includes(channel.name)) {
        log(
          guild,
          `tempcheck used by ${printUser(actor)} ` +
          `in #${channel.name}, which is IGNORED`,
        );
        return;
      }
      if (actor.bot) {
        return;
      }
      await message.react('✅');
      await message.react('⚠️');
      await message.react('🛑');
      log(guild, `tempcheck used by ${printUser(actor)} in #${channel.name}`);
    });
  },
};
