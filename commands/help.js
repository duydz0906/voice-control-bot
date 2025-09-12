import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Hiển thị các danh mục trợ giúp');

export async function execute(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help-menu')
    .setPlaceholder('Chọn một danh mục để xem các lệnh')
    .addOptions([
      {
        label: 'Player',
        value: 'player',
        description: 'Lệnh trình phát nhạc',
        emoji: '🎵'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  const embed = new EmbedBuilder()
    .setTitle('Ziji Help')
    .setDescription('Chọn một danh mục để xem các lệnh');

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
