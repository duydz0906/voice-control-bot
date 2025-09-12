import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Show the current music queue');

export async function execute(interaction, Manager) {
  const plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection)
    return interaction.reply({ content: 'Nothing is playing.', ephemeral: true });

  const current = plr.queue.currentTrack;
  const tracks = plr.queue.getTracks();
  const lines = tracks.map((t, i) => `${i + 1}. ${t.title}`);
  let description = '';
  if (current) description += `Now playing: **${current.title}**\n\n`;
  description += lines.join('\n');
  if (!description.trim()) description = 'Queue is empty.';

  const embed = new EmbedBuilder().setTitle('Current Queue').setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
