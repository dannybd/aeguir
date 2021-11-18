""" Alerts mods when pause and stop reacts are used """
from common import get_guild_key, get_stable_embed_color, member_has_role
import discord
from discord.ext import commands
from emoji import emojize

CARETAKER_ROLES = {
    "sibr": 738108360964178082,
    "dannybd-test": 904974590986559508,
}


def caretaker_role(guild):
    role_id = CARETAKER_ROLES[get_guild_key(guild)]
    return guild.get_role(role_id)


REPORT_CHANNELS = {
    "sibr": 738589319656112229,
    "dannybd-test": 904863674806718506,
}


def report_channel(guild):
    channel_id = REPORT_CHANNELS[get_guild_key(guild)]
    return guild.get_channel(channel_id)


EMOJIS = [emojize(":pause_button:"), emojize(":stop_sign:")]


def is_ignored_channel(channel):
    return channel.name in [
        "mod-chat",
        "mod-log",
        "carl-spam-zone",
        "welcome-logs",
        "archive-ops-pings",
        "announcements",
        "faq",
        "roles-and-sigils",
        "dispatch",
        "rules",
        "modmail-log",
    ]


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
        if member_has_role(actor, caretaker_role(guild).id):
            pass  # return
        await send_report(guild, emoji, actor, message, from_reaction=True)

    @commands.Cog.listener("on_message")
    async def handle_messages(self, message):
        emoji = next((emoji for emoji in EMOJIS if emoji in message.content), None)
        if not emoji:
            return
        actor = message.author
        if actor == self.bot.user:
            return
        if actor.bot:
            return
        guild = message.guild
        if member_has_role(actor, caretaker_role(guild).id):
            pass  # return
        await send_report(guild, emoji, actor, message)


async def send_report(guild, emoji, actor, message, from_reaction=False):
    channel = message.channel
    if is_ignored_channel(channel):
        return
    report_message = "{}: {} in {}".format(
        caretaker_role(guild).mention,
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
    await report_channel(guild).send(report_message, embed=embed)


def setup(bot):
    cog = PauseStop(bot)
    bot.add_cog(cog)
