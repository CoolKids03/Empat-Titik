import { DurableObject } from "cloudflare:workers";

const MAX_STATE_BYTES = 5 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export class GameRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Hibernation WebSocket API: connections can remain open while the DO is idle.
    this.ctx.acceptWebSocket(server);

    // Let the client know the current shared state, or that the first client
    // should provide the initial state.
    await this.sendCurrentState(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async sendCurrentState(ws) {
    const state = await this.ctx.storage.get("game_state");
    if (state) {
      this.safeSend(ws, { type: "state", state });
    } else {
      this.safeSend(ws, { type: "need_state" });
    }
  }

  safeSend(ws, message) {
    try {
      ws.send(JSON.stringify(message));
    } catch (_) {
      // Socket may have closed between getWebSockets() and send().
    }
  }

  async webSocketMessage(ws, message) {
    try {
      const text = typeof message === "string" ? message : new TextDecoder().decode(message);
      if (text.length > MAX_STATE_BYTES) return;

      const msg = JSON.parse(text);

      if (msg?.type === "request_state") {
        await this.sendCurrentState(ws);
        return;
      }

      if (msg?.type !== "state" || !msg.state) return;
      if (!Array.isArray(msg.state.players) || !msg.state.regions || typeof msg.state.regions !== "object") return;

      // Last valid client update wins. The game is intentionally a single
      // global board, so every connected browser receives the same snapshot.
      await this.ctx.storage.put("game_state", msg.state);
      this.broadcast({ type: "state", state: msg.state });
    } catch (_) {
      // Ignore malformed client messages rather than breaking the room.
    }
  }

  broadcast(message) {
    for (const ws of this.ctx.getWebSockets()) {
      this.safeSend(ws, message);
    }
  }

  webSocketClose(ws) {
    try { ws.close(); } catch (_) {}
  }

  webSocketError(ws) {
    try { ws.close(); } catch (_) {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("WebSocket endpoint", { status: 426 });
      }

      // One fixed Durable Object name creates one global shared game board.
      const id = env.GAME_ROOM.idFromName("global");
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
