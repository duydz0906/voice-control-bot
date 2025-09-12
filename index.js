// index.js (ESM)
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { PlayerManager } from 'ziplayer';
import { YouTubePlugin, SoundCloudPlugin, SpotifyPlugin, TTSPlugin } from '@ziplayer/plugin';
import { voiceExt } from '@ziplayer/extension';

const prefix = '!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const Manager = new PlayerManager({
  plugins: [
    new TTSPlugin({ defaultLang: 'vi' }),
    new YouTubePlugin(),
    new SoundCloudPlugin(),
    new SpotifyPlugin(),
  ],
  extensions: [new voiceExt(null, { client, lang: 'vi-VN', minimalVoiceMessageDuration: 1 })],
});

// ===== Helper: nhận diện track TTS =====
const isTTSTrack = (track) => {
  return (
    track?.source === 'tts' ||
    (typeof track?.url === 'string' && track.url.startsWith('tts:')) ||
    /tts/i.test(track?.title || '') ||
    /tts/i.test(track?.author || '')
  );
};

// ===== Sự kiện cơ bản =====
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

// Khi TTS kết thúc: resume hoặc khôi phục volume nếu có ducking
Manager.on('trackEnd', (plr, track) => {
  if (!isTTSTrack(track)) return;

  // Trường hợp đã pause cứng để nói
  if (plr.userdata?._pausedByTTS) {
    plr.userdata._pausedByTTS = false;
    try {
      plr.resume();
    } catch {}
    plr.userdata?.channel?.send?.('🗣️ Đã nói xong — tiếp tục phát nhạc.');
  }

  // Trường hợp dùng ducking (giảm volume)
  if (plr.userdata?._duckedByTTS) {
    plr.userdata._duckedByTTS = false;
    const prev = plr.userdata?._prevVolume;
    if (typeof prev === 'number') {
      try {
        plr.setVolume(prev);
      } catch {}
    }
    plr.userdata._prevVolume = undefined;
  }
});

// ===== Nhận diện voice (voiceExt) =====
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

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === 'join') {
    if (!message.member.voice.channel)
      return message.channel.send('You must be in a voice channel');

    let thread;
    try {
      thread = await message.channel.threads.create({
        name: `voice-${message.author.username}`,
        autoArchiveDuration: 60,
      });
    } catch (e) {
      console.log('Failed to create thread', e);
    }

    const outputChannel = thread ?? message.channel;

    const player = Manager.create(message.guild.id, {
      userdata: { channel: outputChannel },
      selfDeaf: true,
      leaveOnEmpty: false,
      leaveOnEnd: false,
      // Chọn extensions cho player này (tên hoặc instance)
      extensions: ['voiceExt'],
    });

    try {
      if (!player.connection) await player.connect(message.member.voice.channel);
      outputChannel.send('Joined your voice channel');
    } catch (e) {
      console.log(e);
      return outputChannel.send('Could not join your voice channel');
    }
  } else if (command === 'say') {
    const plr = Manager.get(message.guild.id);
    const outputChannel = plr?.userdata?.channel || message.channel;

    const text = args.join(' ').trim();
    if (!text) return outputChannel.send('Usage: !say <text>');

    if (!plr || !plr.connection) return outputChannel.send('Use !join first so I can speak.');

    const query = `tts: ${text}`;

    try {
      // Reset cờ
      plr.userdata._pausedByTTS = false;
      plr.userdata._duckedByTTS = false;

      // Ước lượng trạng thái paused (nếu SDK có thuộc tính/hàm)
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

      // Bắt đầu phát TTS
      const playPromise = plr.play(query, message.author.id).catch(() => null);

      // Nếu đang pause cứng, nhưng một số engine không phát TTS khi pause:
      // sau ~1.2s nếu vẫn còn paused, chuyển qua ducking (resume + giảm volume)
      setTimeout(() => {
        try {
          const stillPaused =
            (typeof plr.paused !== 'undefined' && !!plr.paused) ||
            (typeof plr.isPaused === 'function' && !!plr.isPaused());
          if (didHardPause && stillPaused) {
            // bật resume + hạ volume
            plr.userdata._prevVolume = plr.volume;
            const duckVol = Math.max(5, Math.floor((plr.volume || 100) * 0.1));
            try {
              plr.setVolume(duckVol);
            } catch {}
            plr.userdata._duckedByTTS = true;
            plr.userdata._pausedByTTS = false;
            plr.resume();
          }
        } catch {}
      }, 1200);

      await playPromise;
      outputChannel.send(`🗣️ ${text}`);
      // Việc resume/khôi phục volume sẽ do 'trackEnd' xử lý khi TTS kết thúc.
    } catch (err) {
      console.log(err);
      outputChannel.send('Không thể phát TTS lúc này.');
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
