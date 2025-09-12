import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resume the music');

export async function execute(interaction, Manager) {
  const plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection)
    return interaction.reply({ content: 'Nothing to resume.', ephemeral: true });
  try {
    plr.resume();
  } catch {}
  await interaction.reply({ content: '▶️ Resumed.', ephemeral: true });
}
