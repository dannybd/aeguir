#! /usr/bin/python3

import configparser
import discord
import logging
import os
import traceback
import glob

from common import *
from discord.ext import commands

# Define logging levels
loglevel = os.environ.get("LOGLEVEL", "INFO").upper()
logging.basicConfig(
    format="%(asctime)s [%(process)d][%(name)s - %(levelname)s] - %(message)s",
    level=loglevel,
    handlers=[
        logging.FileHandler("logs/bot.log"),
        logging.StreamHandler(),
    ],
)
if loglevel == "INFO":
    logging.getLogger("discord").setLevel(logging.WARNING)


intents = discord.Intents.default()
intents.members = True

default_help = commands.DefaultHelpCommand(
    no_category="Other Commands",
)


bot = commands.Bot(
    command_prefix=["aeguir ", "Aeguir "],
    description="Aeguir Penguin, a SIBR bot",
    help_command=default_help,
    intents=intents,
)


@bot.event
async def on_ready():
    logging.info("Connected as {0.user} and ready!".format(bot))


logging.info("Loading extensions...")
for extension in glob.glob("extensions/*.py"):
    try:
        ext = extension[:-3]
        ext = ext.replace("/", ".")
        logging.info("Loading {}".format(ext))
        bot.load_extension(ext)
    except Exception as e:
        exc = "{}: {}".format(type(e).__name__, traceback.format_exc())
        logging.warning("Failed to load extension {}\n{}".format(extension, exc))

logging.info("Starting!")
bot_config = configparser.ConfigParser()
bot_config.read("config.ini")
bot.run(bot_config["discord"]["botsecret"])
logging.info("Done, closing out")
