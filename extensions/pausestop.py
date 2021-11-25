""" Alerts mods when pause and stop reacts are used """
import discord

from common import get_config, get_stable_embed_color, log
from discord.ext import commands
from emoji import emojize


EMOJIS = [emojize(":pause_button:"), emojize(":stop_sign:")]


class PauseStop(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener("on_raw_reaction_add")
    async def handle_reacts(self, payload):
        if payload.user_id == self.bot.user.id:
            return
        if payload.member.bot:
            return
        if not payload.guild_id:
            return
        emoji = str(payload.emoji)
        if emoji is None:
            return
        if emoji not in EMOJIS:
            return
        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return
        channel = guild.get_channel(payload.channel_id)
        if not channel:
            return
        message = await channel.fetch_message(payload.message_id)
        if not message:
            return
        if any(emoji in message.content for emoji in EMOJIS):
            # Ran already on the content
            return
        reaction_count = sum(
            reaction.count
            for reaction in message.reactions
            if str(reaction.emoji) == emoji
        )
        if reaction_count != 1:
            # Not the first one of these
            return
        actor = payload.member
        await send_report(guild, emoji, actor, message, from_reaction=True)

    @commands.Cog.listener("on_message")
    async def handle_messages(self, message):
        guild = message.guild
        if not guild:
            return
        emoji = next((emoji for emoji in EMOJIS if emoji in message.content), None)
        if not emoji:
            return
        actor = message.author
        if actor == self.bot.user:
            return
        if actor.bot:
            return
        await send_report(guild, emoji, actor, message, from_reaction=False)


async def send_report(guild, emoji, actor, message, from_reaction):
    channel = message.channel
    config = get_config(guild)
    if channel.name in config["ignored_channels"]:
        log(guild, f"{emoji}  used by {actor} in #{channel}, which is IGNORED")
        return
    mod_role = discord.utils.get(guild.roles, name=config["mod_role"])
    report_message = "{}: {} in {}".format(
        mod_role.mention,
        emoji,
        channel.mention,
    )
    content = message.content
    embed = discord.Embed(
        color=get_stable_embed_color(str(channel)),
        title="{} in #{}".format(emoji, channel.name),
        description="**Message:** {}\n{}".format(
            "_({} in reaction to this message)_".format(emoji) if from_reaction else "",
            content[:500] + "..." if len(content) > 500 else content,
        ),
    )
    embed.add_field(name="Channel", value=channel.mention, inline=True)
    embed.add_field(name="Who?", value=actor.mention, inline=True)
    embed.add_field(
        name="Link", value="[Jump to Message]({})".format(message.jump_url), inline=True
    )
    report_channel = discord.utils.get(guild.channels, name=config["report_channel"])
    await report_channel.send(report_message, embed=embed)
    log(guild, f"{emoji}  used by {actor} in #{channel}")


def setup(bot):
    cog = PauseStop(bot)
    bot.add_cog(cog)
