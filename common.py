import configparser
import discord
from discord.ext import commands
from hashlib import md5


GUILDS = {
    "test": 432741711786278913,
    "sibr": 738107179294523402,
}


def get_guild_key(guild):
    inv_guilds = {v: k for k, v in GUILDS.items()}
    return inv_guilds.get(guild.id)


def is_in_guilds(*guild_keys):
    """Only allow this command on certain guilds"""

    async def predicate(ctx):
        return get_guild_key(ctx.guild) in guild_keys

    return commands.check(predicate)


def member_has_role(member, role_id):
    return role_id in [role.id for role in member.roles]


def get_stable_embed_color(msg):
    hash = md5(msg.encode("utf-8")).hexdigest()
    hue = int(hash, 16) / 16 ** len(hash)
    return discord.Color.from_hsv(hue, 0.655, 1)


config = configparser.ConfigParser()
config.read("config.ini")
