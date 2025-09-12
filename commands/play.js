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
  let plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection) {
    const channel = interaction.member?.voice?.channel;
    if (!channel)
      return interaction.reply({
        content: 'You must be in a voice channel.',
        ephemeral: true,
      });
    plr = Manager.create(interaction.guildId, {
      userdata: { channel: interaction.channel },
      selfDeaf: true,
      leaveOnEmpty: false,
      leaveOnEnd: false,
    });
    try {
      await plr.connect(channel);
    } catch (e) {
      console.log(e);
      return interaction.reply({ content: 'Could not join your voice channel.', ephemeral: true });
    }
  }
  try {
    await plr.play(query, interaction.user.id);
    await interaction.reply({ content: `Queued: **${query}**`, ephemeral: true });
  } catch (e) {
    console.log(e);
    await interaction.reply({ content: 'Failed to play.', ephemeral: true });
  }
}
