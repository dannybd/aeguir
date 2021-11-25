""" Ensure we can reload aeguir without restarting """
from common import bust_cache, get_config, is_mod
from discord.ext import commands


class Reload(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command()
    async def reload(self, ctx):
        if ctx.author.bot:
            return
        if not ctx.guild:
            return
        if not is_mod(ctx.author):
            return
        new_val = bust_cache(ctx.guild)
        await ctx.channel.send("Cache index now = {}".format(new_val))


def setup(bot):
    cog = Reload(bot)
    bot.add_cog(cog)
