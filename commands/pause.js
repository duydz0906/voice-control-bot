import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the music');

export async function execute(interaction, Manager) {
  const plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection)
    return interaction.reply({ content: 'Nothing to pause.', ephemeral: true });
  try {
    plr.pause();
  } catch {}
  await interaction.reply({ content: '⏸️ Paused.', ephemeral: true });
}
