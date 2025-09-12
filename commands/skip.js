import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current track');

export async function execute(interaction, Manager) {
  const plr = Manager.get(interaction.guildId);
  if (!plr || !plr.connection)
    return interaction.reply({ content: 'Nothing to skip.', ephemeral: true });
  try {
    plr.skip();
  } catch {}
  await interaction.reply({ content: '⏭️ Skipped.', ephemeral: true });
}
