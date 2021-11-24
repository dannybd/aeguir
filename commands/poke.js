const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poke')
    .setDescription('Tests command is alive'),
  async execute(interaction) {
    await interaction.reply('Hello, I am alive');
  },
};
