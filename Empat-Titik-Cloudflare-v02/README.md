# Empat-Titik Cloudflare v02

Cloudflare Workers + Durable Objects version of Empat-Titik.

- `public/game.html` = board game client
- `src/index.js` = Worker + one global Durable Object room
- `wrangler.jsonc` = Workers Assets + WebSocket + SQLite Durable Object config
- `package.json` = Wrangler deployment setup

The game uses one fixed Durable Object name (`global`), so all visitors to the same Worker URL share one live board.

Cloudflare setup:
1. Push/upload the `cloudflare` folder to the GitHub repository.
2. In Cloudflare Workers & Pages, import the repository.
3. Set Root Directory to `cloudflare`.
4. Leave Build command blank.
5. Use Deploy command `npx wrangler deploy`.
6. Deploy.

Do not deploy the old Render `server.js` package as a Cloudflare Worker; this folder is the Cloudflare-compatible version.
