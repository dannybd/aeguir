const {
  getConfig,
  getStableEmbedColor,
  log,
  printUser,
  wrapErrors,
} = require('../common.js');
const { MessageEmbed } = require('discord.js');

const EMOJIS = ['⏸', '🛑'];

async function sendReport(guild, emoji, actor, message, fromReaction) {
  const channel = message.channel;
  if (!channel.name) {
    return;
  }
  const config = getConfig(guild);
  if (config['ignored_channels'].includes(channel.name)) {
    log(
      guild,
      `${emoji}  used by ${printUser(actor)} ` +
      `in #${channel.name}, which is IGNORED`,
    );
    return;
  }
  const modRole = guild.roles.cache.find(
    role => role.name === config['mod_role'],
  );
  const reportMessage = `${modRole}: ${emoji} in ${channel}`;
  const content = message.content || '';
  const embed = new MessageEmbed({
    color: getStableEmbedColor(channel.name),
    title: `${emoji} in #${channel.name}`,
    description: '**Message:** ' +
      `${fromReaction ? `_(${emoji} in reaction to this message)_` : ''}\n` +
      (content.length > 500 ? content.substr(0, 500) + '...' : content),
  });
  embed.addField('Channel', channel.toString(), true);
  embed.addField('Who?', actor.toString(), true);
  embed.addField('Link', `[Jump to Message](${message.url})`, true);
  const reportChannel = guild.channels.cache.find(
    c => c.name === config['report_channel'],
  );
  await reportChannel.send({ content: reportMessage, embeds: [embed] });
  log(guild, `${emoji}  used by ${printUser(actor)} in #${channel.name}`);
}

module.exports = {
  setup: (client) => {
    client.on('messageReactionAdd', wrapErrors(async (reaction, actor) => {
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error(error);
          return;
        }
      }
      if (actor.bot) {
        return;
      }
      const { count, emoji, message } = reaction;
      if (count !== 1) {
        // Not the first one of these
        return;
      }
      const { guild, channel, content } = message;
      if (!guild || !channel) {
        return;
      }
      if (!EMOJIS.find(e => reaction.emoji.name.includes(e))) {
        return;
      }
      if (EMOJIS.find(e => content?.includes(e))) {
        // Ran already on the content
        return;
      }
      // fromReaction = true
      await sendReport(guild, emoji, actor, message, true);
    }));

    client.on('messageCreate', wrapErrors(async (message) => {
      if (message.partial) {
        try {
          await message.fetch();
        } catch (error) {
          console.error(error);
          return;
        }
      }
      const guild = message.guild;
      if (!guild) {
        return;
      }
      const emoji = EMOJIS.find(e => message.content?.includes(e));
      if (!emoji) {
        return;
      }
      const actor = message.member?.user;
      if (!actor) {
        return;
      }
      if (actor.bot) {
        return;
      }
      // fromReaction = false
      await sendReport(guild, emoji, actor, message, false);
    }));
  },
};
