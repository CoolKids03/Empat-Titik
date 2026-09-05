# Empat-Titik Online v01

Prototype online untuk permainan papan Empat-Titik. Semua browser yang membuka URL service yang sama melihat **satu papan bersama** dan perubahan permainan disiarkan melalui WebSocket. Tidak ada login atau room pada versi ini.

## Struktur
- `server.js` — server HTTP + WebSocket
- `package.json` — dependency dan perintah start
- `public/game.html` — client game

## Render
- Service type: **Web Service**
- Runtime: **Node**
- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: kosong

Server memakai `process.env.PORT`, sehingga cocok dengan port yang diberikan Render.

## Catatan
State permainan disimpan sementara di RAM server. Jika service restart, state akan kembali ke awal saat browser pertama terhubung. Ini memang untuk prototype awal.
