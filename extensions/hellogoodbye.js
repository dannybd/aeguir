const {
  getConfig,
  log,
  printUser,
  wrapErrors,
} = require('../common.js');
const { MessageEmbed } = require('discord.js');
const { setTimeout: wait } = require('timers/promises');

async function sendHelloGoodbyeReport(member, isHello, additionalFields) {
  const { guild, user } = member;
  const config = getConfig(guild);
  if (!config['hello_goodbye_channel']) {
    return;
  }
  const helloGoodbyeChannel = guild.channels.cache.find(
    c => c.name === config['hello_goodbye_channel'],
  );
  if (!helloGoodbyeChannel) {
    return;
  }
  const embed = new MessageEmbed()
    .setColor(isHello ? 'PURPLE' : 'DARKER_GREY')
    .addFields(
      { name: 'User', value: printUser(user), inline: true },
      { name: 'ID', value: member.id, inline: true },
      { name: '\u200B', value: '\u200B' },
      ...additionalFields,
    );
  const displayAvatarURL = member.displayAvatarURL({ dynamic: true });
  if (displayAvatarURL) {
    embed.setThumbnail(displayAvatarURL);
  }
  await helloGoodbyeChannel.send({
    content: isHello ? `👋 ${member} joined!` : `🍃 ${printUser(user)} left`,
    embeds: [embed],
  });
  // log(guild, `tempcheck used by ${printUser(user)} in #${channel.name}`);
}

// Initialize the invite cache
const invites = new Map();

module.exports = {
  setup: (client) => {
    client.on('guildMemberAdd', wrapErrors(async (member) => {
      const { guild } = member;
      const newInvites = await guild.invites.fetch();
      const oldInvites = invites.get(guild.id);
      const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
      if (invite) {
        oldInvites.set(invite.code, invite.uses);
      }
      const inviter = invite.inviterId
        ? client.users.cache.get(invite.inviterId)
        : null;
      const inviteFields = inviter
        ? [
            { name: 'Invite', value: invite.code, inline: true },
            { name: 'Channel', value: `${invite.channel}`, inline: true },
            { name: '\u200B', value: '\u200B' },

            { name: 'Invite Creator', value: printUser(inviter), inline: true },
            { name: 'Invite Uses', value: `${invite.uses}`, inline: true },
            { name: '\u200B', value: '\u200B' },
          ]
        : [
            { name: 'Invite', value: '[unknown]', inline: true },
          ];
      await sendHelloGoodbyeReport(member, true, inviteFields);
    }));

    client.on('guildMemberRemove', wrapErrors(async (member) => {
      await sendHelloGoodbyeReport(
        member,
        false,
        [
          {
            name: 'Last Joined',
            value: member.joinedAt
              ?.toISOString()
              ?.replace('T', ' ')
              ?.slice(0, -5)
              || '[unknown]',
          },
          {
            name: 'Roles',
            value: member.roles.cache.map(role => role.name)
              .filter(x => x !== '@everyone')
              .join(', ')
              || '[none]',
          },
        ],
      );
    }));


    // Courtesy of:
    // https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
    client.on('ready', wrapErrors(async () => {
      // "ready" isn't really ready. We need to wait a spell.
      await wait(1000);

      // Loop over all the guilds
      client.guilds.cache.forEach(async (guild) => {
        // Fetch all Guild Invites
        const firstInvites = await guild.invites.fetch();
        // Set the key as Guild ID, and create a map which has the invite code,
        // and the number of uses
        invites.set(
          guild.id,
          new Map(firstInvites.map((invite) => [invite.code, invite.uses])),
        );
      });
    }));

    client.on('inviteDelete', wrapErrors(async (invite) => {
      // Delete the Invite from Cache
      invites.get(invite.guild.id).delete(invite.code);
    }));

    client.on('inviteCreate', wrapErrors(async (invite) => {
      // Update cache on new invites
      invites.get(invite.guild.id).set(invite.code, invite.uses);
    }));

    client.on('guildCreate', wrapErrors(async (guild) => {
      // We've been added to a new Guild. Let's fetch all the invites,
      // and save it to our cache
      guild.invites.fetch().then(guildInvites => {
        // This is the same as the ready event
        invites.set(
          guild.id,
          new Map(guildInvites.map((invite) => [invite.code, invite.uses])),
        );
      })
    }));

    client.on('guildDelete', wrapErrors(async (guild) => {
      // We've been removed from a Guild. Let's delete all their invites
      invites.delete(guild.id);
    }));
  },
};
