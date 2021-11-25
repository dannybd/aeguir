const {getConfig} = require('../common.js');

module.exports = {
  setup: (client) => {
    client.on('messageCreate', message => {
      console.log(getConfig(message.guild));
    });
  },
};
