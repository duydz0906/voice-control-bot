// index.js (ESM) – đã sửa voiceExt(null, {...}) để nhận giọng nói như file cũ
import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
} from 'discord.js';
import { PlayerManager } from 'ziplayer';
import { YouTubePlugin, SoundCloudPlugin, SpotifyPlugin, TTSPlugin } from '@ziplayer/plugin';
import { voiceExt } from '@ziplayer/extension';
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prefix = '!';

const sendEmbed = (channel, content) => {
  const embed = new EmbedBuilder().setDescription(content);
  return channel.send({ embeds: [embed] });
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Load slash commands từ ./commands (nếu có)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
client.commands = new Map();

async function loadSlashCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const slashData = [];
  if (!existsSync(commandsPath)) {
    console.log('No ./commands folder found. Skipping slash setup.');
    return { slashData, names: [] };
  }
  const files = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const mod = await import(`./commands/${file}`);
    if (!mod?.data || !mod?.execute) {
      console.warn(`Skip ${file}: missing "data" or "execute" export`);
      continue;
    }
    client.commands.set(mod.data.name, mod);
    slashData.push(mod.data.toJSON());
  }
  const names = [...client.commands.keys()];
  console.log(`Loaded ${names.length} slash command(s): ${names.join(', ')}`);
  return { slashData, names };
}

// ── PlayerManager (SỬA CHỖ NÀY: để null ở tham số đầu)
const Manager = new PlayerManager({
  plugins: [
    new TTSPlugin({ defaultLang: 'vi' }),
    new YouTubePlugin(),
    new SoundCloudPlugin(),
    new SpotifyPlugin(),
  ],
  // Đúng kiểu cũ: null => dùng tên mặc định "voiceExt"
  extensions: [new voiceExt(null, { client, lang: 'vi-VN', minimalVoiceMessageDuration: 1 })],
});

// ===== Basic events
Manager.on('trackStart', (plr, track) => {
  plr.userdata?.channel?.send?.(`Started playing: **${track.title}**`);
});
Manager.on('queueAdd', (plr, track) => {
  plr.userdata?.channel?.send?.(`Added to player: **${track.title}**`);
});
Manager.on('playerError', (plr, error) => {
  console.log(`[${plr.guildId}] Player error:`, error);
});
// Manager.on('debug', console.log);
Manager.on('willPlay', (plr, track, upcomming) => {
  console.log(`${track.title} will play next!`);
  plr.userdata?.channel?.send?.(
    `Upcomming: **${track.title}**, and \n${upcomming.map((t) => `${t.title}\n`)}`
  );
});

// ===== Helper: nhận diện track TTS
const isTTSTrack = (track) => {
  return (
    track?.source === 'tts' ||
    (typeof track?.url === 'string' && track.url.startsWith('tts:')) ||
    /tts/i.test(track?.title || '') ||
    /tts/i.test(track?.author || '')
  );
};

// Khi TTS kết thúc: resume hoặc khôi phục volume nếu có ducking
Manager.on('trackEnd', (plr, track) => {
  if (!isTTSTrack(track)) return;

  if (plr.userdata?._pausedByTTS) {
    plr.userdata._pausedByTTS = false;
    try { plr.resume(); } catch {}
    plr.userdata?.channel?.send?.('🗣️ Đã nói xong — tiếp tục phát nhạc.');
  }

  if (plr.userdata?._duckedByTTS) {
    plr.userdata._duckedByTTS = false;
    const prev = plr.userdata?._prevVolume;
    if (typeof prev === 'number') {
      try { plr.setVolume(prev); } catch {}
    }
    plr.userdata._prevVolume = undefined;
  }
});

// ===== Voice control (voiceExt)
Manager.on('voiceCreate', async (plr, evt) => {
  const userTag = evt.user?.tag || evt.userId;
  plr.userdata?.channel?.send?.(`??? ${userTag}: ${evt.content}`);

  const lowerContent = evt.content.toLowerCase();
  const player = Manager.get(evt.guildId);
  const { channel } = player.userdata;

  const commands = {
    'skip|bỏ qua|next': () => {
      player.skip();
      console.log('Đã bỏ qua bài hát hiện tại');
      channel.send('⏭ | Skipped the current track');
    },
    'volume|âm lượng': () => {
      const volumeMatch = lowerContent.match(/\d+/);
      if (volumeMatch) {
        const newVolume = parseInt(volumeMatch[0]);
        if (newVolume >= 0 && newVolume <= 100) {
          player.setVolume(newVolume);
          console.log(`Đã đặt âm lượng thành ${newVolume}%`);
          channel.send(`🔊 | Volume set to: **${newVolume}%**`);
        } else {
          channel.send('❌ | Volume must be a number between 0 and 100');
          console.log('Âm lượng phải nằm trong khoảng từ 0 đến 100');
        }
      } else {
        channel.send(`🔊 | Current volume is: **${player.volume}**`);
        console.log('Không tìm thấy giá trị âm lượng hợp lệ trong lệnh');
      }
    },
    'pause|tạm dừng': () => {
      player.pause();
      console.log('Đã tạm dừng phát nhạc');
      channel.send('⏸ | Paused the music');
    },
    'resume|tiếp tục': () => {
      player.resume();
      console.log('Đã tiếp tục phát nhạc');
      channel.send('▶ | Resumed the music');
    },
    'disconnect|ngắt kết nối': () => {
      player.destroy();
      console.log('Đã ngắt kết nối');
      channel.send('👋 | Left the voice channel');
    },
    'auto play|tự động phát': async () => {
      player.queue.autoPlay(!player.queue.autoPlay());
      console.log('auto plays on');
      channel.send(`🔁 | Autoplay is now: **${player.queue.autoPlay() ? 'Enabled' : 'Disabled'}**`);
    },
    'play|tìm|phát|hát': async () => {
      const query = lowerContent.replace(/play|tìm|phát|hát/g, '').trim();
      const suss = await player.play(query);
      channel.send(suss ? `✅ | **${query}**` : `❌ | **${query}**`);
    },
    'xóa hàng đợi': async () => {
      player.queue.clear();
      channel.send('Queue Clear');
    },
  };

  for (const [pattern, action] of Object.entries(commands)) {
    if (lowerContent.match(new RegExp(pattern))) {
      await action();
      return;
    }
  }
});

// ===== Slash commands
client.once('ready', async () => {
  const { slashData, names } = await loadSlashCommands();

  try {
    if (process.env.GUILD_ID) {
      const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
      if (guild) {
        await guild.commands.set(slashData);
        console.log(`Registered ${names.length} slash command(s) in guild: ${guild.name}`);
      } else {
        console.log('GUILD_ID không hợp lệ hoặc bot chưa ở guild đó.');
      }
    } else {
      await client.application.commands.set(slashData);
      console.log(`Registered ${names.length} GLOBAL slash command(s).`);
    }
  } catch (err) {
    console.log('Failed to register slash commands', err);
  }

  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, Manager);
  } catch (err) {
    console.log(err);
    const reply = { content: 'There was an error executing that command.' };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

// ===== Message commands
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // GIỮ NGUYÊN: !join như file cũ
  if (command === 'join') {
    if (!message.member.voice.channel) return message.channel.send('You must be in a voice channel');

    const player = Manager.create(message.guild.id, {
      userdata: { channel: message.channel },
      selfDeaf: true,
      leaveOnEmpty: false,
      leaveOnEnd: false,
      // chọn extension theo TÊN (sẽ khớp vì ta đã đăng ký đúng ở trên)
      extensions: ['voiceExt'],
    });

    try {
      if (!player.connection) await player.connect(message.member.voice.channel);
      message.channel.send('Joined your voice channel');
      console.log('Player extensions:', player.extensions?.map?.((e) => e?.name) || '(none)');
    } catch (e) {
      console.log(e);
      return message.channel.send('Could not join your voice channel');
    }

  } else if (command === 'say') {
    const plr = Manager.get(message.guild.id);
    const outputChannel = plr?.userdata?.channel || message.channel;

    const text = args.join(' ').trim();
    if (!text) return sendEmbed(outputChannel, 'Usage: !say <text>');
    if (!plr || !plr.connection) return sendEmbed(outputChannel, 'Use !join first so I can speak.');

    const query = `tts: ${text}`;

    try {
      // Reset cờ
      plr.userdata._pausedByTTS = false;
      plr.userdata._duckedByTTS = false;

      // Ước lượng trạng thái paused
      const isPaused =
        (typeof plr.paused !== 'undefined' && !!plr.paused) ||
        (typeof plr.isPaused === 'function' && !!plr.isPaused());

      // Thử "pause cứng" nếu đang phát
      let didHardPause = false;
      if (!isPaused) {
        try {
          plr.pause();
          didHardPause = true;
          plr.userdata._pausedByTTS = true;
        } catch {}
      }

      // Phát TTS
      const playPromise = plr.play(query, message.author.id).catch(() => null);

      // Nếu pause cứng làm TTS không chạy → chuyển sang ducking
      setTimeout(() => {
        try {
          const stillPaused =
            (typeof plr.paused !== 'undefined' && !!plr.paused) ||
            (typeof plr.isPaused === 'function' && !!plr.isPaused());
          if (didHardPause && stillPaused) {
            plr.userdata._prevVolume = plr.volume;
            const duckVol = Math.max(5, Math.floor((plr.volume || 100) * 0.1));
            try { plr.setVolume(duckVol); } catch {}
            plr.userdata._duckedByTTS = true;
            plr.userdata._pausedByTTS = false;
            plr.resume();
          }
        } catch {}
      }, 1200);

      await playPromise;
      sendEmbed(outputChannel, `🗣️ ${text}`);
      // Resume/khôi phục volume do 'trackEnd' xử lý
    } catch (err) {
      console.log(err);
      sendEmbed(outputChannel, 'Không thể phát TTS lúc này.');
    }
  }
});

client.login(process.env.TOKEN);

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
  console.log(err.stack);
});
process.on('unhandledRejection', function (err) {
  console.log('Handled exception: ' + err);
  console.log(err.stack);
});
