import express from 'express';
import http from 'http';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  createInitialMatchState,
  applyDiceRoll,
  applyTokenMove,
  chooseSmartBotMove,
  PLAYER_ORDER,
  type LudoMatchState,
  type PlayerColor,
} from './src/game/ludoRules';
import {
  COIN_BUNDLES,
  validatePaymentInput,
  type PaymentGatewayPayload,
} from './src/game/storeCatalog';
import {
  normalizeTelegramInput,
  type TelegramUserProfile,
} from './src/game/telegramAuth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verifies Telegram Login Widget / OAuth payload signature using SHA256(botToken)
 */
function verifyTelegramOAuthHash(
  query: Record<string, string | undefined>,
  botToken: string
): boolean {
  const { hash, ...rest } = query;
  if (!hash) return false;
  const dataCheckString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== '')
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  return computedHash === hash;
}

/**
 * Verifies Telegram Mini App (WebApp) initData using HMAC-SHA256("WebAppData", botToken)
 */
function verifyTelegramWebAppInitData(
  initDataRaw: string,
  botToken: string
): { valid: boolean; user?: TelegramUserProfile } {
  try {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    if (!hash) return { valid: false };

    const pairs: string[] = [];
    params.forEach((val, key) => {
      if (key !== 'hash') {
        pairs.push(`${key}=${val}`);
      }
    });
    pairs.sort();
    const dataCheckString = pairs.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      return { valid: false };
    }

    const userRaw = params.get('user');
    if (!userRaw) return { valid: false };
    const parsed = JSON.parse(userRaw);
    return {
      valid: true,
      user: {
        id: Number(parsed.id),
        firstName: String(parsed.first_name || 'Telegram Player'),
        lastName: parsed.last_name ? String(parsed.last_name) : undefined,
        username: parsed.username ? String(parsed.username) : undefined,
        photoUrl: parsed.photo_url ? String(parsed.photo_url) : undefined,
        languageCode: parsed.language_code,
        isPremium: Boolean(parsed.is_premium),
        authMethod: 'webapp',
        authDate: Number(params.get('auth_date') || Math.floor(Date.now() / 1000)),
      },
    };
  } catch {
    return { valid: false };
  }
}

interface RoomSession {
  roomCode: string;
  hostClientId: string;
  isPrivate: boolean;
  matchState: LudoMatchState;
  clients: Map<
    string,
    {
      ws: WebSocket;
      clientId: string;
      playerName: string;
      assignedColor: PlayerColor;
      isMicActive: boolean;
    }
  >;
  chatMessages: {
    id: string;
    senderName: string;
    senderColor: PlayerColor;
    text: string;
    timestamp: string;
  }[];
}

const rooms = new Map<string, RoomSession>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function broadcastToRoom(room: RoomSession, payload: unknown, excludeClientId?: string) {
  const raw = JSON.stringify(payload);
  for (const [clientId, client] of room.clients.entries()) {
    if (excludeClientId && clientId === excludeClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(raw);
    }
  }
}

function scheduleBotTurnIfNeeded(room: RoomSession) {
  const state = room.matchState;
  if (state.winner || state.turnPhase === 'GAME_OVER') return;

  const activePlayer = state.players[state.currentTurn];
  if (!activePlayer.isBot) return;

  setTimeout(() => {
    const currentRoom = rooms.get(room.roomCode);
    if (!currentRoom) return;
    const st = currentRoom.matchState;
    if (st.winner || st.currentTurn !== activePlayer.color) return;

    if (st.turnPhase === 'WAIT_ROLL') {
      const dice = Math.floor(Math.random() * 6) + 1;
      currentRoom.matchState = applyDiceRoll(st, dice);
      broadcastToRoom(currentRoom, {
        type: 'room:state',
        roomCode: currentRoom.roomCode,
        matchState: currentRoom.matchState,
      });
      scheduleBotTurnIfNeeded(currentRoom);
    } else if (st.turnPhase === 'WAIT_MOVE' && st.diceValue !== null) {
      const chosenToken = chooseSmartBotMove(st, activePlayer.color, st.diceValue);
      if (chosenToken !== null) {
        currentRoom.matchState = applyTokenMove(st, activePlayer.color, chosenToken);
        broadcastToRoom(currentRoom, {
          type: 'room:state',
          roomCode: currentRoom.roomCode,
          matchState: currentRoom.matchState,
        });
        scheduleBotTurnIfNeeded(currentRoom);
      }
    }
  }, 650);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.use(express.json());

  // Health & room lookup API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Telegram Bot Configuration & OAuth Endpoints
  app.get('/api/auth/telegram/config', (_req, res) => {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const botUsername = (
      process.env.TELEGRAM_BOT_USERNAME || 'RoyalLudo3DBot'
    )
      .trim()
      .replace(/^@+/, '');
    const appUrl = (
      process.env.APP_URL || 'http://localhost:3000'
    ).replace(/\/+$/, '');

    res.json({
      botUsername,
      hasBotToken: Boolean(botToken && botToken.includes(':')),
      callbackUrl: `${appUrl}/auth/telegram/callback`,
    });
  });

  // Construct direct Telegram OAuth provider URL for popup login
  app.get('/api/auth/telegram/url', (req, res) => {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const botId = botToken.includes(':') ? botToken.split(':')[0] : '';
    const appUrl = (
      process.env.APP_URL ||
      (typeof req.query.origin === 'string' && req.query.origin) ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
    const returnTo = `${appUrl}/auth/telegram/callback`;

    if (!botId) {
      res.json({
        configured: false,
        returnTo,
        message:
          'TELEGRAM_BOT_TOKEN is not set yet. Use the Telegram Bot Profile sign-in or launch inside your Telegram Mini App.',
      });
      return;
    }

    const params = new URLSearchParams({
      bot_id: botId,
      origin: appUrl,
      embed: '1',
      request_access: 'write',
      return_to: returnTo,
    });

    res.json({
      configured: true,
      url: `https://oauth.telegram.org/auth?${params.toString()}`,
      returnTo,
    });
  });

  // Handle Telegram OAuth Callback (both with and without trailing slash)
  const telegramCallbackHandler: express.RequestHandler = (req, res) => {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const queryObj: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') queryObj[k] = v;
    }

    if (botToken && queryObj.hash) {
      const ok = verifyTelegramOAuthHash(queryObj, botToken);
      if (!ok) {
        res.status(401).send('Invalid Telegram signature');
        return;
      }
    }

    const norm = normalizeTelegramInput({
      id: queryObj.id,
      firstName: queryObj.first_name || queryObj.username || 'Telegram Player',
      lastName: queryObj.last_name,
      username: queryObj.username,
      photoUrl: queryObj.photo_url,
      authMethod: 'oauth',
    });

    const userPayload = JSON.stringify(norm.profile || null);

    res.send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Telegram Authenticated</title></head>
  <body style="background:#03112e;color:#fff;font-family:sans-serif;text-align:center;padding-top:40px;">
    <script>
      const user = ${userPayload};
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'telegram', user }, '*');
        window.close();
      } else {
        window.location.href = '/';
      }
    </script>
    <p>Telegram login successful! Returning to Royal Ludo 3D Arena...</p>
  </body>
</html>`);
  };

  app.get(['/auth/telegram/callback', '/auth/telegram/callback/'], telegramCallbackHandler);

  // Verify Telegram Mini App (window.Telegram.WebApp.initData)
  app.post('/api/auth/telegram/webapp', (req, res) => {
    const { initData, unsafeUser } = req.body as {
      initData?: string;
      unsafeUser?: Partial<TelegramUserProfile>;
    };
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

    if (initData && botToken && botToken.includes(':')) {
      const verified = verifyTelegramWebAppInitData(initData, botToken);
      if (verified.valid && verified.user) {
        res.json({ success: true, verified: true, user: verified.user });
        return;
      }
    }

    if (unsafeUser && unsafeUser.firstName) {
      const norm = normalizeTelegramInput({
        id: unsafeUser.id,
        firstName: unsafeUser.firstName,
        lastName: unsafeUser.lastName,
        username: unsafeUser.username,
        photoUrl: unsafeUser.photoUrl,
        isPremium: unsafeUser.isPremium,
        authMethod: 'webapp',
      });
      if (norm.valid && norm.profile) {
        res.json({ success: true, verified: false, user: norm.profile });
        return;
      }
    }

    res.status(400).json({ success: false, error: 'Unable to verify Telegram WebApp data' });
  });

  // Direct Telegram Bot Player Profile Login Endpoint
  app.post('/api/auth/telegram/login', (req, res) => {
    const body = req.body as {
      id?: string | number;
      firstName?: string;
      lastName?: string;
      username?: string;
      photoUrl?: string;
      isPremium?: boolean;
    };

    const norm = normalizeTelegramInput({
      id: body.id,
      firstName: body.firstName || '',
      lastName: body.lastName,
      username: body.username,
      photoUrl: body.photoUrl,
      isPremium: body.isPremium,
      authMethod: 'bot_profile',
    });

    if (!norm.valid || !norm.profile) {
      res.status(400).json({ success: false, error: norm.error });
      return;
    }

    res.json({
      success: true,
      user: norm.profile,
    });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.json({
      roomCode: room.roomCode,
      isPrivate: room.isPrivate,
      connectedCount: room.clients.size,
      matchState: room.matchState,
    });
  });

  // Payment Gateway Checkout Endpoint
  app.post('/api/payments/checkout', (req, res) => {
    const payload = req.body as PaymentGatewayPayload;
    const validation = validatePaymentInput(payload);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const bundle = COIN_BUNDLES.find((b) => b.id === payload.bundleId)!;
    const totalCredited = bundle.coins + bundle.bonusCoins;
    const transactionId = `TX-GW-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    res.json({
      success: true,
      transaction: {
        id: transactionId,
        bundleId: bundle.id,
        description: `${bundle.name} (${totalCredited} Coins)`,
        amountCoins: totalCredited,
        priceUSD: bundle.priceUSD,
        method: payload.method,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // WebSocket Server for Real-Time Multiplayer, Private Rooms & WebRTC Voice Signaling
  // Use noServer: true so ws does not abort non-/ws WebSocket upgrades (such as @vite/client vite-hmr)
  const wss = new WebSocketServer({ noServer: true });
  const hmrFallbackWss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    let boundRoomCode: string | null = null;
    let boundClientId: string | null = null;

    ws.on('message', (rawBuf) => {
      try {
        const msg = JSON.parse(rawBuf.toString());

        if (msg.type === 'room:create') {
          const clientId = String(msg.clientId || `client-${Date.now()}`);
          const playerName = String(msg.playerName || 'Host Commander').slice(0, 24);
          const roomCode = msg.customCode
            ? String(msg.customCode).toUpperCase().slice(0, 6)
            : generateRoomCode();
          const fillBots = msg.fillBots !== false;

          const matchState = createInitialMatchState(roomCode, 'online_room', {
            red: { name: playerName, isBot: false, id: clientId },
            green: { name: 'Emerald Bot', isBot: fillBots, id: 'bot-green' },
            yellow: { name: 'Solar Bot', isBot: fillBots, id: 'bot-yellow' },
            blue: { name: 'Sapphire Bot', isBot: fillBots, id: 'bot-blue' },
          });

          const room: RoomSession = {
            roomCode,
            hostClientId: clientId,
            isPrivate: Boolean(msg.isPrivate ?? true),
            matchState,
            clients: new Map(),
            chatMessages: [
              {
                id: `msg-${Date.now()}`,
                senderName: 'Arena Server',
                senderColor: 'red',
                text: `Private room ${roomCode} created by ${playerName}. Share code to invite players!`,
                timestamp: new Date().toISOString(),
              },
            ],
          };

          room.clients.set(clientId, {
            ws,
            clientId,
            playerName,
            assignedColor: 'red',
            isMicActive: false,
          });
          rooms.set(roomCode, room);
          boundRoomCode = roomCode;
          boundClientId = clientId;

          ws.send(
            JSON.stringify({
              type: 'room:joined',
              roomCode,
              assignedColor: 'red',
              matchState: room.matchState,
              chatMessages: room.chatMessages,
            })
          );
          return;
        }

        if (msg.type === 'room:join') {
          const roomCode = String(msg.roomCode || '')
            .trim()
            .toUpperCase();
          const clientId = String(msg.clientId || `client-${Date.now()}`);
          const playerName = String(msg.playerName || 'Challenger').slice(0, 24);

          let room = rooms.get(roomCode);
          if (!room) {
            // Auto-provision requested room code so cross-device join always succeeds
            const matchState = createInitialMatchState(roomCode, 'online_room', {
              red: { name: playerName, isBot: false, id: clientId },
              green: { name: 'Emerald Bot', isBot: true, id: 'bot-green' },
              yellow: { name: 'Solar Bot', isBot: true, id: 'bot-yellow' },
              blue: { name: 'Sapphire Bot', isBot: true, id: 'bot-blue' },
            });
            room = {
              roomCode,
              hostClientId: clientId,
              isPrivate: true,
              matchState,
              clients: new Map(),
              chatMessages: [
                {
                  id: `msg-${Date.now()}`,
                  senderName: 'Arena Server',
                  senderColor: 'red',
                  text: `Room ${roomCode} initialized. Waiting for challengers.`,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
            rooms.set(roomCode, room);
          }

          // Check if client already has a color slot or claim next available bot slot
          let assignedColor: PlayerColor = 'red';
          const existing = room.clients.get(clientId);
          if (existing) {
            assignedColor = existing.assignedColor;
          } else {
            const takenColors = new Set(
              Array.from(room.clients.values()).map((c) => c.assignedColor)
            );
            const openColor =
              PLAYER_ORDER.find((c) => !takenColors.has(c)) ?? 'green';
            assignedColor = openColor;
            room.matchState.players[assignedColor] = {
              ...room.matchState.players[assignedColor],
              id: clientId,
              name: playerName,
              isBot: false,
              isConnected: true,
            };
          }

          room.clients.set(clientId, {
            ws,
            clientId,
            playerName,
            assignedColor,
            isMicActive: false,
          });
          boundRoomCode = roomCode;
          boundClientId = clientId;

          room.matchState.actionLog = [
            `${playerName} joined Room ${roomCode} as ${assignedColor.toUpperCase()}.`,
            ...room.matchState.actionLog.slice(0, 14),
          ];

          ws.send(
            JSON.stringify({
              type: 'room:joined',
              roomCode,
              assignedColor,
              matchState: room.matchState,
              chatMessages: room.chatMessages,
            })
          );

          broadcastToRoom(
            room,
            {
              type: 'room:state',
              roomCode,
              matchState: room.matchState,
              peerJoined: { clientId, playerName, assignedColor },
            },
            clientId
          );
          return;
        }

        if (!boundRoomCode) return;
        const room = rooms.get(boundRoomCode);
        if (!room) return;

        if (msg.type === 'game:roll') {
          const dice =
            typeof msg.diceValue === 'number' && msg.diceValue >= 1 && msg.diceValue <= 6
              ? msg.diceValue
              : Math.floor(Math.random() * 6) + 1;
          room.matchState = applyDiceRoll(room.matchState, dice);
          broadcastToRoom(room, {
            type: 'room:state',
            roomCode: room.roomCode,
            matchState: room.matchState,
          });
          scheduleBotTurnIfNeeded(room);
          return;
        }

        if (msg.type === 'game:move') {
          const color = msg.color as PlayerColor;
          const tokenIndex = Number(msg.tokenIndex);
          room.matchState = applyTokenMove(room.matchState, color, tokenIndex);
          broadcastToRoom(room, {
            type: 'room:state',
            roomCode: room.roomCode,
            matchState: room.matchState,
          });
          scheduleBotTurnIfNeeded(room);
          return;
        }

        if (msg.type === 'chat:send') {
          const text = String(msg.text || '').trim().slice(0, 180);
          if (!text) return;
          const client = boundClientId ? room.clients.get(boundClientId) : undefined;
          const chatItem = {
            id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderName: client?.playerName || String(msg.senderName || 'Player'),
            senderColor: client?.assignedColor || (msg.senderColor as PlayerColor) || 'red',
            text,
            timestamp: new Date().toISOString(),
          };
          room.chatMessages.push(chatItem);
          if (room.chatMessages.length > 40) room.chatMessages.shift();
          broadcastToRoom(room, {
            type: 'chat:message',
            roomCode: room.roomCode,
            message: chatItem,
          });
          return;
        }

        if (msg.type === 'voice:status') {
          const isMicActive = Boolean(msg.isMicActive);
          if (boundClientId && room.clients.has(boundClientId)) {
            const c = room.clients.get(boundClientId)!;
            c.isMicActive = isMicActive;
            room.matchState.players[c.assignedColor].isMicActive = isMicActive;
            broadcastToRoom(room, {
              type: 'room:state',
              roomCode: room.roomCode,
              matchState: room.matchState,
            });
          }
          return;
        }

        // Relay WebRTC SDP offers/answers/ICE candidates between room peers
        if (msg.type === 'voice:signal') {
          broadcastToRoom(
            room,
            {
              type: 'voice:signal',
              fromClientId: boundClientId,
              signalData: msg.signalData,
            },
            boundClientId ?? undefined
          );
          return;
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (boundRoomCode && boundClientId) {
        const room = rooms.get(boundRoomCode);
        if (room) {
          const client = room.clients.get(boundClientId);
          if (client) {
            room.matchState.players[client.assignedColor].isMicActive = false;
            room.clients.delete(boundClientId);
            broadcastToRoom(room, {
              type: 'room:state',
              roomCode: room.roomCode,
              matchState: room.matchState,
            });
          }
        }
      }
    });
  });

  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.on('upgrade', (req, socket, head) => {
    const urlPath = (req.url || '').split('?')[0];
    const protocol = req.headers['sec-websocket-protocol'] || '';

    if (urlPath === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }

    // If HMR is disabled or a stray vite-hmr client connects, accept cleanly so @vite/client never throws
    if (isHmrDisabled && String(protocol).includes('vite-hmr')) {
      hmrFallbackWss.handleUpgrade(req, socket, head, (ws) => {
        ws.send(JSON.stringify({ type: 'connected' }));
      });
    }
  });

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Royal Ludo 3D Arena server listening on http://localhost:${PORT}`);
  });
}

startServer();
