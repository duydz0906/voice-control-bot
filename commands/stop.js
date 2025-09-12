import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop the player and clear the queue');

export async function execute(interaction, Manager) {
  const plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection)
    return interaction.reply({ content: 'Nothing to stop.', ephemeral: true });
  try {
    plr.destroy();
  } catch {}
  await interaction.reply({ content: '⏹️ Stopped.', ephemeral: true });
}
