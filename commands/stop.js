// commands/leave.js
import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Leave the voice channel');

export async function execute(interaction, Manager) {
  const plr = Manager.get(interaction.guildId);

  if (!plr || !plr.connection) {
    return interaction.reply({
      content: 'I am not in a voice channel.',
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    // Rời voice channel (giống hành vi bạn dùng ở voice command "disconnect")
    plr.destroy();
  } catch (e) {
    // Không chặn lỗi, chỉ log cho biết
    console.log('leave error:', e);
  }

  await interaction.reply({
    content: '👋 Left the voice channel.',
    flags: MessageFlags.Ephemeral,
  });
}
