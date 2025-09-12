# Voice Bot (Discord) – Tiếng Việt

Bot phát nhạc + nhận lệnh giọng nói cho Discord. Hỗ trợ YouTube/SoundCloud/Spotify/TTS, và **“nói chen”**: khi dùng `!say`, bot sẽ tạm dừng nhạc để nói, nói xong tự **tiếp tục** (hoặc tự động chuyển sang **ducking** – giảm âm lượng tạm thời – nếu engine không phát TTS khi pause).

## Yêu cầu
- Node.js >= 18 (khuyến nghị 20+)
- Token Discord Bot (quyền `MESSAGE CONTENT INTENT` + voice intents)

## Cài đặt
```bash
npm install
```

## Slash Commands
Các lệnh slash được tách thành các file riêng trong thư mục `/commands`.
- `/play <query>` – thêm bài hát vào hàng đợi
- `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/ping`

## Message Commands
- `!join` – tham gia kênh voice và tạo thread
- `!say <text>` – bot nói TTS (trả lời qua embed)
- `!help` – liệt kê các lệnh khả dụng
