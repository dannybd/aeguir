import discord
import json
import logging
import traceback

from discord.ext import commands
from functools import lru_cache
from hashlib import md5


GUILDS = {
    "test": 432741711786278913,
    "sibr": 738107179294523402,
}


def get_guild_key(guild):
    inv_guilds = {v: k for k, v in GUILDS.items()}
    return inv_guilds.get(guild.id)


def is_mod(member):
    config = get_config(member.guild)
    return bool(discord.utils.get(member.roles, name=config["mod_role"]))


def get_stable_embed_color(msg):
    hash = md5(msg.encode("utf-8")).hexdigest()
    hue = int(hash, 16) / 16 ** len(hash)
    return discord.Color.from_hsv(hue, 0.655, 1)


CACHE_BUSTER = 0


def bust_cache(guild):
    global CACHE_BUSTER
    CACHE_BUSTER += 1
    get_config(guild)
    return CACHE_BUSTER


def get_config(guild):
    global CACHE_BUSTER
    while True:
        try:
            return get_config_impl(guild, CACHE_BUSTER)
        except Exception as e:
            if CACHE_BUSTER == 0:
                raise e
            CACHE_BUSTER -= 1
            logging.warning(
                f"Failed to read config, rolling back to counter at {CACHE_BUSTER}. Exception:\n{format_exception(e)}",
            )


def log(guild, msg):
    logging.info(f">>> GUILD {get_guild_key(guild).upper()}: {msg}")


def format_exception(e):
    return f"{type(e).__name__}: {traceback.format_exc()}"


@lru_cache(maxsize=128)
def get_config_impl(guild, cache_counter):
    key = get_guild_key(guild)
    log(guild, f"Reloading data, cache counter = {cache_counter}")
    with open("data/{}.json".format(key), "r") as f:
        return json.load(f)
