// ping.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { performance } from 'node:perf_hooks';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Kiểm tra độ trễ và trạng thái bot');

export async function execute(interaction) {
  // Đo nhanh RTT (round-trip) tới thời điểm defer
  const start = Date.now();
  await interaction.deferReply({ ephemeral: false }); // đổi thành true nếu muốn chỉ mình bạn thấy
  const rtt = Date.now() - interaction.createdTimestamp;

  // Ước lượng "độ trễ vòng lặp" (event loop) rất nhẹ nhàng
  const loopDelay = await new Promise((resolve) => {
    const t0 = performance.now();
    setImmediate(() => resolve(Math.round(performance.now() - t0)));
  });

  // Ping WebSocket do Discord cung cấp
  const wsPing = Math.round(interaction.client.ws.ping || 0);

  // Đánh giá chất lượng ping
  let quality = '🟢 Tốt';
  if (wsPing > 250 || rtt > 500 || loopDelay > 80) quality = '🔴 Kém';
  else if (wsPing > 150 || rtt > 300 || loopDelay > 40) quality = '🟡 Trung bình';

  // Thời gian hiện tại theo múi giờ VN
  const nowStr = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Ảnh đại diện & banner
  const requesterAvatar = interaction.user.displayAvatarURL({ size: 256 });
  const botAvatar = interaction.client.user.displayAvatarURL({ size: 256 });
  const bannerUrl = process.env.PING_BANNER_URL || 'https://i.imgur.com/AfFp7pu.png'; // đổi link theo ý bạn

  const embed = new EmbedBuilder()
    .setColor(0x9159f6)
    .setAuthor({ name: '🔴 Pong!', iconURL: botAvatar })
    .setDescription(`Chào ${interaction.user}! Đây là độ trễ và trạng thái ping của tôi:`)
    .setThumbnail(requesterAvatar)
    .addFields(
      { name: '🕒 Độ trễ vòng lặp', value: `${loopDelay}ms`, inline: true },
      { name: '📶 Trạng thái độ trễ', value: quality.replace(/^/, ''), inline: true },
      { name: '🕑 Dấu thời gian hiện tại', value: nowStr, inline: false },
    )
    .setImage(bannerUrl)
    .setFooter({
      text: `Yêu cầu bởi: ${interaction.user.tag ?? interaction.user.username}`,
      iconURL: requesterAvatar,
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
