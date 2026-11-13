import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialMatchState,
  applyDiceRoll,
  applyTokenMove,
  chooseSmartBotMove,
  type LudoMatchState,
  type PlayerColor,
} from './game/ludoRules';
import {
  createInitialWalletState,
  purchaseCatalogItem,
  type BoardThemeId,
  type TokenSkinId,
  type WalletState,
} from './game/storeCatalog';
import { soundFX } from './game/soundEffects';
import { VoiceChatController } from './game/voiceChat';
import {
  AuthSplashView,
  HomeLobbyView,
  ColorAndStakeSetupView,
} from './components/PhoneLobbyScreens';
import { PhoneMatchScreen } from './components/PhoneMatchScreen';
import {
  PhoneSettingsModal,
  PhoneLeaderboardModal,
  PhoneWalletAndThemesModal,
} from './components/PhoneModals';
import { PrivateRoomAndVoiceDrawer } from './components/PrivateRoomAndVoiceDrawer';
import { GameStatusModal } from './components/GameStatusModal';
import { TelegramAuthModal } from './components/TelegramAuthModal';
import {
  TELEGRAM_STORAGE_KEY,
  detectTelegramLaunchContext,
  formatTelegramDisplayName,
  formatTelegramHandle,
  type TelegramUserProfile,
} from './game/telegramAuth';

const WALLET_STORAGE_KEY = 'royal_ludo_wallet_v1';

function loadSavedWallet(): WalletState {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WalletState;
      if (typeof parsed.coins === 'number' && Array.isArray(parsed.ownedThemes)) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return createInitialWalletState();
}

function loadSavedTelegramUser(): TelegramUserProfile | null {
  try {
    const raw = localStorage.getItem(TELEGRAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TelegramUserProfile;
      if (parsed && typeof parsed.id === 'number' && parsed.firstName) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export type PhoneScreenState =
  | 'auth'
  | 'lobby'
  | 'setup'
  | 'playing'
  | 'paused'
  | 'gameover';

export default function App() {
  const [telegramUser, setTelegramUser] = useState<TelegramUserProfile | null>(
    () => loadSavedTelegramUser()
  );
  const [screen, setScreen] = useState<PhoneScreenState>('playing');
  const [playerName, setPlayerName] = useState<string>(() => {
    const savedTg = loadSavedTelegramUser();
    return savedTg ? formatTelegramDisplayName(savedTg) : 'Rajdeep Banik';
  });
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('yellow');
  const [pendingMode, setPendingMode] = useState<
    'single_vs_bots' | 'online_room' | 'private_room' | 'pass_and_play'
  >('single_vs_bots');
  const [winPrizeCoins, setWinPrizeCoins] = useState(100);

  const [matchState, setMatchState] = useState<LudoMatchState>(() => {
    const savedTg = loadSavedTelegramUser();
    const initialName = savedTg
      ? formatTelegramDisplayName(savedTg)
      : 'Rajdeep Banik';
    return createInitialMatchState('ROYAL7', 'single_vs_bots', {
      red: { name: initialName, isBot: false },
    });
  });
  const [wallet, setWallet] = useState<WalletState>(() => loadSavedWallet());
  const [isMuted, setIsMuted] = useState(false);

  // Phone Modals
  const [walletModal, setWalletModal] = useState<{
    isOpen: boolean;
    tab: 'wallet' | 'themes';
  }>({ isOpen: false, tab: 'wallet' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [roomDrawerOpen, setRoomDrawerOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

  // Real-Time WebSocket & Voice Chat State
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(
    telegramUser
      ? `tg-${telegramUser.id}`
      : `user-${Math.random().toString(36).slice(2, 9)}`
  );
  const [wsConnected, setWsConnected] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [voiceStatusText, setVoiceStatusText] = useState(
    'Tap Voice Mic to talk with room players'
  );
  const [chatMessages, setChatMessages] = useState<
    {
      id: string;
      senderName: string;
      senderColor: PlayerColor;
      text: string;
      timestamp: string;
    }[]
  >([
    {
      id: 'welcome-msg',
      senderName: 'Ludo Club',
      senderColor: 'red',
      text: 'Welcome to Royal Ludo Telegram Bot Arena! Roll a 6 to break out of the chain.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const voiceControllerRef = useRef<VoiceChatController | null>(null);

  const applyTelegramUserLogin = useCallback(
    (profile: TelegramUserProfile) => {
      soundFX.playPurchaseSuccess();
      setTelegramUser(profile);
      try {
        localStorage.setItem(TELEGRAM_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        // ignore
      }
      const displayName = formatTelegramDisplayName(profile);
      const handle = formatTelegramHandle(profile);
      setPlayerName(displayName);
      clientIdRef.current = `tg-${profile.id}`;

      setMatchState((prev) => ({
        ...prev,
        players: {
          ...prev.players,
          red: {
            ...prev.players.red,
            id: `tg-${profile.id}`,
            name: displayName,
          },
        },
        actionLog: [
          `Telegram Bot connected: ${displayName} (${handle}).`,
          ...prev.actionLog.slice(0, 14),
        ],
      }));
    },
    []
  );

  // Auto-detect Telegram Mini App WebApp or URL query params & listen for Telegram OAuth popup
  useEffect(() => {
    const detected = detectTelegramLaunchContext();
    if (detected.profile) {
      fetch('/api/auth/telegram/webapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: detected.initDataRaw,
          unsafeUser: detected.profile,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.user) {
            applyTelegramUserLogin(data.user);
          } else if (detected.profile) {
            applyTelegramUserLogin(detected.profile);
          }
        })
        .catch(() => {
          if (detected.profile) {
            applyTelegramUserLogin(detected.profile);
          }
        });
    }

    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        applyTelegramUserLogin(event.data.user as TelegramUserProfile);
        setTelegramModalOpen(false);
        setScreen('playing');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [applyTelegramUserLogin]);

  // Sync body dataset state for testing/verification
  useEffect(() => {
    const mapped =
      screen === 'playing' || screen === 'paused' || screen === 'gameover'
        ? screen
        : 'title';
    document.body.dataset.state = mapped;
  }, [screen]);

  // Save wallet state on change
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    } catch {
      // ignore
    }
  }, [wallet]);

  // Initialize WebSocket Connection for Private Rooms & Voice Signaling
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (disposed) {
            socket?.close();
            return;
          }
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          if (disposed) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'room:joined') {
              setMatchState(msg.matchState);
              if (Array.isArray(msg.chatMessages)) {
                setChatMessages(msg.chatMessages);
              }
            } else if (msg.type === 'room:state') {
              setMatchState(msg.matchState);
            } else if (msg.type === 'chat:message' && msg.message) {
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (
                  last &&
                  last.text === msg.message.text &&
                  last.senderName === msg.message.senderName
                ) {
                  return prev;
                }
                return [...prev.slice(-39), msg.message];
              });
            } else if (msg.type === 'voice:signal' && msg.signalData) {
              voiceControllerRef.current?.handleIncomingSignal(msg.signalData);
            }
          } catch {
            // ignore malformed frame
          }
        };

        socket.onclose = () => {
          if (disposed) return;
          setWsConnected(false);
          reconnectTimer = window.setTimeout(connect, 3500);
        };
      } catch {
        setWsConnected(false);
      }
    };

    connect();

    voiceControllerRef.current = new VoiceChatController(
      (lvl) => setMicLevel(lvl),
      (signalData) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'voice:signal',
              signalData,
            })
          );
        }
      }
    );

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      voiceControllerRef.current?.stopMicrophone();
    };
  }, []);

  // Watch for match victory
  useEffect(() => {
    if (
      screen === 'playing' &&
      matchState.winner &&
      matchState.turnPhase === 'GAME_OVER'
    ) {
      soundFX.playGoalChime();
      setScreen('gameover');
      setWallet((prev) => ({
        ...prev,
        coins: prev.coins + winPrizeCoins,
        transactions: [
          {
            id: `TX-WIN-${Date.now().toString().slice(-4)}`,
            description: 'Match Victory Reward',
            amountCoins: winPrizeCoins,
            timestamp: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      }));
    }
  }, [screen, matchState.winner, matchState.turnPhase, winPrizeCoins]);

  // Local Bot Automation Loop
  useEffect(() => {
    if (screen !== 'playing' || matchState.winner) return;
    if (matchState.mode === 'online_room' && wsConnected) return;

    const activePlayer = matchState.players[matchState.currentTurn];
    if (!activePlayer.isBot) return;

    const lm = matchState.lastMove;
    const walkedSteps = lm
      ? Math.max(1, lm.toStep - Math.max(0, lm.fromStep))
      : 1;
    const delayMs =
      matchState.turnPhase === 'WAIT_ROLL'
        ? Math.max(780, walkedSteps * 165 + 480)
        : 620;

    const timer = window.setTimeout(() => {
      setMatchState((prev) => {
        if (prev.winner || prev.currentTurn !== activePlayer.color) return prev;
        if (prev.turnPhase === 'WAIT_ROLL') {
          const dice = Math.floor(Math.random() * 6) + 1;
          soundFX.playDiceRoll();
          return applyDiceRoll(prev, dice);
        }
        if (prev.turnPhase === 'WAIT_MOVE' && prev.diceValue !== null) {
          const tokenIdx = chooseSmartBotMove(
            prev,
            activePlayer.color,
            prev.diceValue
          );
          if (tokenIdx !== null) {
            const next = applyTokenMove(prev, activePlayer.color, tokenIdx);
            if (next.lastMove?.fromStep === -1 && next.lastMove?.toStep === 0) {
              soundFX.playChainBreak();
            } else if (next.lastMove?.reachedGoal) {
              soundFX.playGoalChime();
            } else {
              soundFX.playTokenStep();
            }
            return next;
          }
        }
        return prev;
      });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [
    screen,
    matchState.currentTurn,
    matchState.turnPhase,
    matchState.diceValue,
    matchState.winner,
    matchState.mode,
    matchState.players,
    matchState.lastMove,
    wsConnected,
  ]);

  const launchMatch = useCallback(
    (
      rawMode: 'single_vs_bots' | 'online_room' | 'private_room' | 'pass_and_play',
      entryCoins = 0,
      winCoins = 100
    ) => {
      const normalizedMode =
        rawMode === 'private_room' ? 'online_room' : rawMode;
      const code =
        normalizedMode === 'online_room'
          ? `RYL${Math.floor(100 + Math.random() * 900)}`
          : matchState.roomCode;

      if (entryCoins > 0 && wallet.coins >= entryCoins) {
        setWallet((prev) => ({
          ...prev,
          coins: prev.coins - entryCoins,
        }));
      }
      setWinPrizeCoins(winCoins);

      const fresh = createInitialMatchState(code, normalizedMode, {
        red: {
          name: playerName || 'Rajdeep Banik',
          isBot: false,
          id: clientIdRef.current,
        },
      });
      setMatchState(fresh);
      setScreen('playing');
      document.body.dataset.state = 'playing';

      if (
        normalizedMode === 'online_room' &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        wsRef.current.send(
          JSON.stringify({
            type: 'room:create',
            clientId: clientIdRef.current,
            playerName: playerName || 'Rajdeep Banik',
            customCode: code,
            fillBots: true,
          })
        );
      }
    },
    [matchState.roomCode, playerName, wallet.coins]
  );

  const handleJoinPrivateRoom = useCallback(
    (code: string) => {
      const upper = code.trim().toUpperCase();
      const fresh = createInitialMatchState(upper, 'online_room', {
        red: {
          name: playerName || 'Rajdeep Banik',
          isBot: false,
          id: clientIdRef.current,
        },
      });
      setMatchState(fresh);
      setScreen('playing');
      document.body.dataset.state = 'playing';
      setRoomDrawerOpen(false);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: upper,
            clientId: clientIdRef.current,
            playerName: playerName || 'Rajdeep Banik',
          })
        );
      }
    },
    [playerName]
  );

  const handleRollDice = useCallback(() => {
    if (screen !== 'playing') return;
    if (matchState.turnPhase !== 'WAIT_ROLL' || matchState.winner) return;
    const activePlayer = matchState.players[matchState.currentTurn];
    if (activePlayer.isBot) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    soundFX.playDiceRoll();

    if (
      matchState.mode === 'online_room' &&
      wsConnected &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      wsRef.current.send(
        JSON.stringify({
          type: 'game:roll',
          diceValue: dice,
        })
      );
    } else {
      setMatchState((prev) => applyDiceRoll(prev, dice));
    }
  }, [screen, matchState, wsConnected]);

  const handleSelectToken = useCallback(
    (color: PlayerColor, tokenIndex: number) => {
      if (screen !== 'playing') return;
      if (matchState.turnPhase !== 'WAIT_MOVE' || matchState.currentTurn !== color) {
        return;
      }
      if (!matchState.validMoves.includes(tokenIndex)) return;

      if (
        matchState.mode === 'online_room' &&
        wsConnected &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        soundFX.playTokenStep();
        wsRef.current.send(
          JSON.stringify({
            type: 'game:move',
            color,
            tokenIndex,
          })
        );
      } else {
        setMatchState((prev) => {
          const next = applyTokenMove(prev, color, tokenIndex);
          if (next.lastMove?.fromStep === -1 && next.lastMove?.toStep === 0) {
            soundFX.playChainBreak();
          } else if (next.lastMove?.reachedGoal) {
            soundFX.playGoalChime();
          } else {
            soundFX.playTokenStep();
          }
          return next;
        });
      }
    },
    [screen, matchState, wsConnected]
  );

  const handleToggleMic = useCallback(async () => {
    if (!voiceControllerRef.current) return;
    const result = await voiceControllerRef.current.toggleMicrophone();
    setIsMicEnabled(result.enabled);
    setVoiceStatusText(result.statusText);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'voice:status',
          isMicActive: result.enabled,
        })
      );
    }
  }, []);

  const handleSendChatMessage = useCallback(
    (text: string) => {
      const msgObj = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        senderName: playerName || 'Rajdeep Banik',
        senderColor: 'red' as PlayerColor,
        text,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev.slice(-39), msgObj]);

      if (
        matchState.mode === 'online_room' &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        wsRef.current.send(
          JSON.stringify({
            type: 'chat:send',
            senderName: msgObj.senderName,
            senderColor: msgObj.senderColor,
            text,
          })
        );
      }
    },
    [playerName, matchState.mode]
  );

  const handlePurchaseOrEquip = useCallback(
    (itemType: 'theme' | 'skin', itemId: BoardThemeId | TokenSkinId) => {
      const res = purchaseCatalogItem(wallet, itemType, itemId);
      if (res.success) {
        soundFX.playPurchaseSuccess();
        setWallet(res.wallet);
      }
      return { success: res.success, error: res.error };
    },
    [wallet]
  );

  const handleAddCoinsViaGateway = useCallback(
    (amountCoins: number, method: string, identifier: string) => {
      soundFX.playPurchaseSuccess();
      setWallet((prev) => ({
        ...prev,
        coins: prev.coins + amountCoins,
        transactions: [
          {
            id: `TX-ADD-${Date.now().toString().slice(-4)}`,
            description: `Deposit via ${method} (${identifier})`,
            amountCoins,
            method,
            timestamp: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      }));
    },
    []
  );

  const handleWithdrawCoins = useCallback(
    (amountWithFee: number, method: string, identifier: string) => {
      if (wallet.coins < amountWithFee) {
        return {
          success: false,
          error: `Insufficient coins. Need ${amountWithFee} coins.`,
        };
      }
      soundFX.playPurchaseSuccess();
      setWallet((prev) => ({
        ...prev,
        coins: prev.coins - amountWithFee,
        transactions: [
          {
            id: `TX-CLM-${Date.now().toString().slice(-4)}`,
            description: `Claimed to ${method} (${identifier})`,
            amountCoins: -amountWithFee,
            method,
            timestamp: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      }));
      return { success: true };
    },
    [wallet.coins]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (
        walletModal.isOpen ||
        settingsOpen ||
        leaderboardOpen ||
        roomDrawerOpen
      ) {
        if (e.code === 'Escape') {
          setWalletModal((s) => ({ ...s, isOpen: false }));
          setSettingsOpen(false);
          setLeaderboardOpen(false);
          setRoomDrawerOpen(false);
        }
        return;
      }

      if (screen === 'auth' || screen === 'lobby' || screen === 'setup') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          launchMatch('single_vs_bots', 0, 100);
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setScreen((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (screen !== 'playing') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleRollDice();
      } else if (e.code === 'Digit1') {
        handleSelectToken(matchState.currentTurn, 0);
      } else if (e.code === 'Digit2') {
        handleSelectToken(matchState.currentTurn, 1);
      } else if (e.code === 'Digit3') {
        handleSelectToken(matchState.currentTurn, 2);
      } else if (e.code === 'Digit4') {
        handleSelectToken(matchState.currentTurn, 3);
      } else if (e.code === 'KeyV') {
        handleToggleMic();
      } else if (e.code === 'KeyL') {
        setRoomDrawerOpen(true);
      } else if (e.code === 'KeyM') {
        setIsMuted((m) => {
          soundFX.isMuted = !m;
          return !m;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screen,
    walletModal.isOpen,
    settingsOpen,
    leaderboardOpen,
    roomDrawerOpen,
    matchState.currentTurn,
    launchMatch,
    handleRollDice,
    handleSelectToken,
    handleToggleMic,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center select-none">
      {/* Centered Phone Mode Frame (Edge-to-Edge on Mobile, Sleek Phone Device Bezel on Desktop) */}
      <div
        className="relative w-full h-full sm:w-[400px] sm:h-[min(844px,96vh)] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
        style={{
          background:
            'linear-gradient(135deg, #031130 0%, #07235c 45%, #020c24 100%)',
        }}
      >
        {/* Subtle Diagonal Royal Stripes matching the User Reference Screenshot */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-35deg, rgba(14, 165, 233, 0.16) 0px, rgba(14, 165, 233, 0.16) 28px, transparent 28px, transparent 76px)',
          }}
        />

        {/* Top Phone Notch Indicator on Desktop */}
        <div className="hidden sm:flex justify-center pt-1.5 pb-0.5 z-30 pointer-events-none">
          <div className="w-28 h-4 rounded-b-xl bg-slate-950/90 border-b border-slate-800" />
        </div>

        {/* Active Phone Screen Content */}
        <div className="relative flex-1 w-full overflow-hidden z-10">
          {screen === 'auth' && (
            <AuthSplashView
              onOpenTelegramLogin={() => setTelegramModalOpen(true)}
              onLoginSuccess={(provider) => {
                if (provider === 'google') setPlayerName('Rajdeep Banik');
                else if (provider === 'facebook') setPlayerName('Arthur Crown');
                setScreen('lobby');
              }}
            />
          )}

          {screen === 'lobby' && (
            <HomeLobbyView
              playerName={playerName}
              telegramUser={telegramUser}
              coins={wallet.coins}
              isMicEnabled={isMicEnabled}
              onSelectModeCard={(mode) => {
                setPendingMode(mode);
                setScreen('setup');
              }}
              onOpenWalletModal={() =>
                setWalletModal({ isOpen: true, tab: 'wallet' })
              }
              onOpenThemesModal={() =>
                setWalletModal({ isOpen: true, tab: 'themes' })
              }
              onOpenLeaderboardModal={() => setLeaderboardOpen(true)}
              onOpenSettingsModal={() => setSettingsOpen(true)}
              onOpenRoomDrawer={() => setRoomDrawerOpen(true)}
              onOpenTelegramModal={() => setTelegramModalOpen(true)}
              onToggleMic={handleToggleMic}
            />
          )}

          {screen === 'setup' && (
            <ColorAndStakeSetupView
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              selectedMode={pendingMode}
              roomCode={matchState.roomCode}
              onStartWithStake={(entry, win) =>
                launchMatch(pendingMode, entry, win)
              }
              onJoinPrivateRoom={handleJoinPrivateRoom}
              onBack={() => setScreen('lobby')}
            />
          )}

          {(screen === 'playing' ||
            screen === 'paused' ||
            screen === 'gameover') && (
            <PhoneMatchScreen
              matchState={matchState}
              telegramUser={telegramUser}
              winPrizeCoins={winPrizeCoins}
              coins={wallet.coins}
              themeId={wallet.equippedTheme}
              skinId={wallet.equippedSkin}
              isMicEnabled={isMicEnabled}
              onRollDice={handleRollDice}
              onSelectToken={handleSelectToken}
              onToggleMic={handleToggleMic}
              onOpenLobby={() => setScreen('lobby')}
              onOpenWallet={() =>
                setWalletModal({ isOpen: true, tab: 'wallet' })
              }
              onOpenThemes={() =>
                setWalletModal({ isOpen: true, tab: 'themes' })
              }
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenRoomChat={() => setRoomDrawerOpen(true)}
              onOpenTelegramLogin={() => setTelegramModalOpen(true)}
              onPauseOrMenu={() => setScreen('paused')}
            />
          )}
        </div>
      </div>

      {/* Pause / Victory Modal */}
      {(screen === 'paused' || screen === 'gameover') && (
        <GameStatusModal
          gameState={screen}
          matchState={matchState}
          onResume={() => setScreen('playing')}
          onRestart={() => launchMatch(pendingMode, 0, winPrizeCoins)}
          onReturnTitle={() => setScreen('lobby')}
        />
      )}

      {/* Telegram Bot Player Login & Room Invite Modal */}
      <TelegramAuthModal
        isOpen={telegramModalOpen}
        currentProfile={telegramUser}
        roomCode={matchState.roomCode}
        onClose={() => setTelegramModalOpen(false)}
        onLoginSuccess={(profile) => {
          applyTelegramUserLogin(profile);
          if (screen === 'auth') {
            setScreen('lobby');
          }
        }}
        onLogoutTelegram={() => {
          setTelegramUser(null);
          try {
            localStorage.removeItem(TELEGRAM_STORAGE_KEY);
          } catch {
            // ignore
          }
        }}
      />

      {/* Screen 5: Claim Amount / Wallet / Payment Gateway & Themes Modal */}
      <PhoneWalletAndThemesModal
        isOpen={walletModal.isOpen}
        initialTab={walletModal.tab}
        wallet={wallet}
        onClose={() => setWalletModal((s) => ({ ...s, isOpen: false }))}
        onAddCoinsViaGateway={handleAddCoinsViaGateway}
        onWithdrawCoins={handleWithdrawCoins}
        onPurchaseOrEquipItem={handlePurchaseOrEquip}
      />

      {/* Screen 6: Settings Modal */}
      <PhoneSettingsModal
        isOpen={settingsOpen}
        isMuted={isMuted}
        isMicEnabled={isMicEnabled}
        roomCode={matchState.roomCode}
        onClose={() => setSettingsOpen(false)}
        onToggleMute={() => {
          setIsMuted((m) => {
            soundFX.isMuted = !m;
            return !m;
          });
        }}
        onToggleMic={handleToggleMic}
        onOpenChat={() => setRoomDrawerOpen(true)}
        onOpenThemes={() => setWalletModal({ isOpen: true, tab: 'themes' })}
        onLogout={() => setScreen('auth')}
      />

      {/* Screen 7: LeaderBoard Modal */}
      <PhoneLeaderboardModal
        isOpen={leaderboardOpen}
        playerName={playerName}
        playerCoins={wallet.coins}
        onClose={() => setLeaderboardOpen(false)}
      />

      {/* Private Room & WebRTC Voice Chat Drawer */}
      <PrivateRoomAndVoiceDrawer
        isOpen={roomDrawerOpen}
        matchState={matchState}
        isMicEnabled={isMicEnabled}
        micLevel={micLevel}
        voiceStatusText={voiceStatusText}
        wsConnected={wsConnected}
        chatMessages={chatMessages}
        onClose={() => setRoomDrawerOpen(false)}
        onToggleMic={handleToggleMic}
        onCreateNewPrivateRoom={() => launchMatch('private_room', 0, 100)}
        onJoinRoomCode={handleJoinPrivateRoom}
        onSendChatMessage={handleSendChatMessage}
      />
    </main>
  );
}
