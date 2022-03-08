const {
  getConfig,
  log,
  printUser,
  wrapErrors,
} = require('../common.js');
const { MessageEmbed, SnowflakeUtil } = require('discord.js');
const { setTimeout: wait } = require('timers/promises');

function getHelloGoodbyeChannel(guild) {
  const config = getConfig(guild);
  if (!config['hello_goodbye_channel']) {
    return null;
  }
  return guild.channels.cache.find(
    c => c.name === config['hello_goodbye_channel'],
  );
}

function getMemberEmbedBase(member) {
  return new MessageEmbed()
    .setAuthor({
      name: `User: ${printUser(member.user)}`,
      iconURL: member.displayAvatarURL({ dynamic: true }),
    })
    .setFooter({ text: `ID ${member.id}` });
}

function getAccountAgeEmbedField(member) {
  return {
    name: 'Account Age',
    value: plural(
      Math.floor(
        (new Date() - SnowflakeUtil.deconstruct(member.id).date) / 86400,
      ),
      'day',
    ),
    inline: true,
  };
}

function plural(num, one, many) {
  if (num === 1) {
    return `${num} ${one}`;
  }
  if (!many) {
    return `${num.toLocaleString()} ${one}s`;
  }
  return `${num.toLocaleString()} ${many}`;
}

// Initialize the invite cache
const invites = new Map();

module.exports = {
  setup: (client) => {
    client.on('guildMemberAdd', wrapErrors(async (member) => {
      const { guild, user } = member;
      const helloGoodbyeChannel = getHelloGoodbyeChannel(guild);
      if (!helloGoodbyeChannel) {
        return;
      }
      const newInvites = await guild.invites.fetch();
      const oldInvites = invites.get(guild.id);
      const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
      if (invite) {
        oldInvites.set(invite.code, invite.uses);
      }
      const inviter = invite?.inviterId
        ? client.users.cache.get(invite.inviterId)
        : null;
      const embed = getMemberEmbedBase(member)
        .setColor('PURPLE')
        .addFields([
          {
            name: 'Invite',
            value: invite
              ? [
                  `🚪 \`${invite.code}\``,
                  `🔁 Used ${plural(invite.uses, 'time')}`,
                  `🙋 ${inviter ? printUser(inviter) : '[unknown]'}`,
                  `➡️ ${invite.channel}`,
                ].join('\n')
              : '[unknown]',
            inline: true,
          },
          getAccountAgeEmbedField(member),
        ]);
      await helloGoodbyeChannel.send({
        content: `👋 ${member} joined!`,
        embeds: [embed],
      });
      log(guild, `Member joined: ${printUser(user)}`);
    }));

    client.on('guildMemberRemove', wrapErrors(async (member) => {
      const { guild, joinedAt, roles, user } = member;
      const helloGoodbyeChannel = getHelloGoodbyeChannel(guild);
      if (!helloGoodbyeChannel) {
        return;
      }
      const embed = getMemberEmbedBase(member)
        .setColor('DARKER_GREY')
        .addFields([
          {
            name: 'Last Joined',
            value: joinedAt?.toISOString()?.replace('T', ' ')?.slice(0, -5)
              || '[unknown]',
            inline: true,
          },
          getAccountAgeEmbedField(member),
          {
            name: 'Roles',
            value: roles.cache.map(role => role.name)
              .filter(x => x !== '@everyone')
              .join(', ')
              || '[none]',
            inline: true,
          },
        ]);
      await helloGoodbyeChannel.send({
        content: `🍃 ${printUser(user)} left`,
        embeds: [embed],
      });
      log(guild, `Member left: ${printUser(user)}`);
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
