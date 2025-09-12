import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency');

export async function execute(interaction) {
  const embed = new EmbedBuilder().setDescription(`🏓 Pong! ${Math.round(interaction.client.ws.ping)}ms`);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
