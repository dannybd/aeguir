const crypto = require('crypto');
const fs = require('fs');
const memoize = require("memoizee");
const path = require('path');
const rgb = require('hsv-rgb');

let CACHE_BUSTER = 0;

const GUILDS = {
  'test': '432741711786278913',
  'sibr': '738107179294523402',
};

function getGuildKey(guild) {
  return Object.keys(GUILDS).find(key => GUILDS[key] === guild.id);
}

function bustCache(guild) {
  CACHE_BUSTER += 1;
  getConfig(guild);
  return CACHE_BUSTER;
}

function getConfig(guild) {
  while (true) {
    try {
      return getConfigImpl(guild, CACHE_BUSTER);
    } catch (error) {
      if (CACHE_BUSTER === 0) {
        throw error;
      }
      CACHE_BUSTER -= 1;
      console.warn(
        `Failed to read config, rolling back to counter at ${CACHE_BUSTER}.`,
        error,
      );
    }
  }
}

const getConfigImpl = memoize((guild, cacheCounter) => {
  const key = getGuildKey(guild);
  log(guild, `Reloading data, cache counter = ${cacheCounter}`);
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `data/${key}.json`)),
  );
});

function log(guild, msg) {
  console.log(`>>> GUILD ${getGuildKey(guild).toUpperCase()}: ${msg}`);
}

function printUser(user) {
  return `${user.username}#${user.discriminator}`;
}


function getStableEmbedColor(msg) {
  const hash = crypto.createHash('md5').update(msg).digest('hex');
  const hue = parseInt(hash, 16) / (16 ** hash.length) * 360;
  return rgb(hue, 65.5, 100);
}

module.exports = {
  bustCache,
  getConfig,
  getStableEmbedColor,
  log,
  printUser,
};
