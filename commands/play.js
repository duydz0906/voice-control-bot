import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song or add it to the queue')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('Song name or URL')
      .setRequired(true)
  );

export async function execute(interaction, Manager) {
  const query = interaction.options.getString('query');
  const plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection)
    return interaction.reply({
      content: 'Use !join first so I can play music.',
      ephemeral: true,
    });
  try {
    await plr.play(query, interaction.user.id);
    await interaction.reply({ content: `Queued: **${query}**`, ephemeral: true });
  } catch (e) {
    console.log(e);
    await interaction.reply({ content: 'Failed to play.', ephemeral: true });
  }
}
