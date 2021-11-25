const { getConfig, log, printUser, wrapErrors } = require('../common.js');

module.exports = {
  setup: (client) => {
    client.on('messageCreate', wrapErrors(async (message) => {
      if (message.partial) {
        try {
          await message.fetch();
        } catch (error) {
          console.error(error);
          return;
        }
      }
      const { content } = message;
      if (!content) {
        return;
      }
      if (!/\bdtempcheck\b/i.test(content)) {
        return;
      }
      const actor = message.member?.user;
      if (!actor) {
        return;
      }
      const { channel, guild } = message;
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
    }));
  },
};
