const {
  getConfig,
  getStableEmbedColor,
  log,
  printUser,
  wrapErrors,
} = require('../common.js');
const { MessageEmbed } = require('discord.js');

async function sendTempcheckReport(guild, actor, message) {
  const channel = message.channel;
  if (!channel.name) {
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
  const modRole = guild.roles.cache.find(
    role => role.name === config['mod_role'],
  );
  const reportMessage = `${modRole}: tempcheck in ${channel}`;
  const content = message.content || '';
  const embed = new MessageEmbed({
    color: getStableEmbedColor(channel.name),
    title: `tempcheck in #${channel.name}`,
    description: '**Message:** \n' +
      (content.length > 500 ? content.substr(0, 500) + '...' : content),
  });
  embed.addField('Channel', channel.toString(), true);
  embed.addField('Who?', actor.toString(), true);
  embed.addField('Link', `[Jump to Message](${message.url})`, true);
  const reportChannel = guild.channels.cache.find(
    c => c.name === config['report_channel'],
  );
  await reportChannel.send({ content: reportMessage, embeds: [embed] });
  log(guild, `tempcheck used by ${printUser(actor)} in #${channel.name}`);
}

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
      if (!/\btempcheck\b/i.test(content)) {
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

      await sendTempcheckReport(guild, actor, message);
    }));
  },
};
