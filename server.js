const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
const publicDir = path.join(__dirname, 'public');
let sharedState = null;

const server = http.createServer((req, res) => {
  let urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/') urlPath = '/game.html';
  const filePath = path.normalize(path.join(publicDir, urlPath));
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath).toLowerCase();
    const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
    res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
function broadcast(message) {
  const raw = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(raw);
  }
}

wss.on('connection', ws => {
  ws.send(JSON.stringify(sharedState ? {type:'state',state:sharedState} : {type:'need_state'}));
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'request_state') {
        ws.send(JSON.stringify(sharedState ? {type:'state',state:sharedState} : {type:'need_state'}));
        return;
      }
      if (msg.type === 'state' && msg.state && Array.isArray(msg.state.players) && msg.state.regions) {
        sharedState = msg.state;
        broadcast({type:'state',state:sharedState});
      }
    } catch (_) {}
  });
});

// Keep WebSocket connections alive.
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }
}, 25000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Empat-Titik online server listening on port ${PORT}`);
});
