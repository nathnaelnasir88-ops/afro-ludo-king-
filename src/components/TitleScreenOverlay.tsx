import React, { useState } from 'react';
import { Crown, Users, Palette, Coins, Play, Shield } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { BOARD_THEMES, TOKEN_SKINS, type BoardThemeId, type TokenSkinId } from '../game/storeCatalog';

interface TitleScreenOverlayProps {
  coins: number;
  equippedTheme: BoardThemeId;
  equippedSkin: TokenSkinId;
  roomCode: string;
  playerName: string;
  onChangePlayerName: (name: string) => void;
  onStartMatch: (mode: 'single_vs_bots' | 'pass_and_play' | 'online_room') => void;
  onJoinPrivateRoom: (code: string) => void;
  onOpenStore: (initialTab?: 'themes' | 'skins' | 'coins') => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenOverlayProps> = ({
  coins,
  equippedTheme,
  equippedSkin,
  roomCode,
  playerName,
  onChangePlayerName,
  onStartMatch,
  onJoinPrivateRoom,
  onOpenStore,
}) => {
  const [selectedMode, setSelectedMode] = useState<
    'single_vs_bots' | 'pass_and_play' | 'online_room'
  >('single_vs_bots');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCodeInput.trim().toUpperCase();
    if (cleaned.length < 4) {
      setJoinError('Enter a valid 4 to 6 character room code.');
      return;
    }
    setJoinError(null);
    onJoinPrivateRoom(cleaned);
  };

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(6, 10, 19, 0.92) 0%, rgba(6, 10, 19, 0.72) 42%, rgba(6, 10, 19, 0.12) 100%)',
      }}
    >
      {/* Top Bar: Royal Treasury Readout + Cross-Platform PWA Install */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/95 border border-amber-500/40 px-3.5 py-2 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-slate-400">Treasury</span>
            <span
              data-testid="title-coin-balance"
              className="text-sm font-bold text-amber-300 font-mono tabular-nums"
            >
              {coins}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenStore('coins')}
            className="rounded-lg bg-amber-500/20 border border-amber-400/50 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            + Buy Coins
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => onOpenStore('themes')}
            className="flex items-center gap-2 rounded-lg bg-slate-900/95 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Store & Themes</span>
          </button>
        </div>
      </div>

      {/* Asymmetric Left-Third Hero Lockup over Calm Negative Space */}
      <div className="w-full max-w-md my-auto pointer-events-auto space-y-5">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="space-y-2">
          <svg
            viewBox="0 0 420 112"
            className="w-full max-w-[390px] h-auto drop-shadow-xl"
            role="img"
            aria-label="Royal Ludo 3D Arena Crest"
          >
            <defs>
              <linearGradient id="goldCrestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {/* Four-house Ludo Diamond Emblem */}
            <g transform="translate(8, 12)">
              <rect
                x="4"
                y="4"
                width="36"
                height="36"
                rx="6"
                fill="#ef4444"
                stroke="#fca5a5"
                strokeWidth="2"
              />
              <rect
                x="46"
                y="4"
                width="36"
                height="36"
                rx="6"
                fill="#10b981"
                stroke="#6ee7b7"
                strokeWidth="2"
              />
              <rect
                x="4"
                y="46"
                width="36"
                height="36"
                rx="6"
                fill="#3b82f6"
                stroke="#93c5fd"
                strokeWidth="2"
              />
              <rect
                x="46"
                y="46"
                width="36"
                height="36"
                rx="6"
                fill="#f59e0b"
                stroke="#fde68a"
                strokeWidth="2"
              />
              <polygon
                points="43,24 62,43 43,62 24,43"
                fill="url(#goldCrestGrad)"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
            {/* Sovereign Typography Lockup */}
            <text
              x="108"
              y="48"
              fill="url(#goldCrestGrad)"
              fontFamily="Cinzel, Georgia, serif"
              fontWeight="800"
              fontSize="33"
              letterSpacing="2"
            >
              ROYAL LUDO
            </text>
            <text
              x="110"
              y="78"
              fill="#f8fafc"
              fontFamily="Cinzel, Georgia, serif"
              fontWeight="700"
              fontSize="19"
              letterSpacing="5.5"
            >
              3D GRAND ARENA
            </text>
            <line
              x1="110"
              y1="88"
              x2="395"
              y2="88"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
          </svg>

          <p className="text-xs text-slate-300 leading-relaxed pl-1">
            Real-time WebSocket multiplayer · WebRTC voice chat · Cross-platform iOS & Android PWA
          </p>
        </div>

        {/* Commander Profile & Equipped Loadout Summary */}
        <div className="rounded-xl bg-slate-900/95 border border-slate-800 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="commander-name-input"
              className="text-xs font-semibold text-slate-300 shrink-0"
            >
              Player Name
            </label>
            <input
              id="commander-name-input"
              type="text"
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              maxLength={20}
              placeholder="Enter commander name"
              className="w-full max-w-[220px] rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <span>
              Board: <strong className="text-slate-200">{BOARD_THEMES[equippedTheme].name}</strong>
            </span>
            <span>·</span>
            <span>
              Skin: <strong className="text-amber-300">{TOKEN_SKINS[equippedSkin].name}</strong>
            </span>
          </div>
        </div>

        {/* Match Mode Selector Tabs */}
        <div className="space-y-2">
          <div
            className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/95 border border-slate-800"
            role="group"
            aria-label="Select Game Mode"
          >
            <button
              type="button"
              onClick={() => setSelectedMode('single_vs_bots')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedMode === 'single_vs_bots'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Vs Bots</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('online_room')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedMode === 'online_room'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Private Room</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('pass_and_play')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedMode === 'pass_and_play'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Pass & Play</span>
            </button>
          </div>
        </div>

        {/* Primary CTA Action Button with mandatory data-start="true" */}
        <button
          type="button"
          data-start="true"
          onClick={(e) => {
            e.currentTarget.blur();
            onStartMatch(selectedMode);
          }}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-sm py-3.5 px-6 shadow-xl transition-transform cursor-pointer whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>
            {selectedMode === 'online_room'
              ? `Create & Enter Private Room (${roomCode})`
              : selectedMode === 'pass_and_play'
              ? 'Start 4-Player Local Table'
              : 'Enter 3D Arena Match'}
          </span>
        </button>

        {/* Quick Join Private Room by Code */}
        <form
          onSubmit={handleJoinSubmit}
          className="rounded-xl bg-slate-900/95 border border-slate-800 p-3.5 space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label htmlFor="join-room-code-input" className="font-medium text-slate-300">
              Have a Friend&apos;s Private Room Code?
            </label>
            <span className="font-mono text-slate-400">Live WS Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="join-room-code-input"
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="e.g. ROYAL9"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono uppercase tracking-wider text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Join Room
            </button>
          </div>
          {joinError && <p className="text-xs text-rose-400">{joinError}</p>}
        </form>
      </div>

      {/* Bottom Single Flat Borderless Control-Hint Line */}
      <div className="text-xs text-slate-400 tracking-wide">
        Space Roll Dice · 1–4 Move Token · V Voice Mic · B Store & Themes · H Hide Dock · Esc Pause
      </div>
    </div>
  );
};
