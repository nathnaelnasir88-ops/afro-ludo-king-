import React, { useState } from 'react';
import {
  Plus,
  Trophy,
  Wallet,
  Settings,
  Share2,
  Bell,
  History,
  Mic,
  MicOff,
  Palette,
  ChevronLeft,
  Play,
  Users,
  Lock,
} from 'lucide-react';
import type { PlayerColor } from '../game/ludoRules';
import {
  formatTelegramHandle,
  type TelegramUserProfile,
} from '../game/telegramAuth';
import { PWAInstallButton } from './PWAInstallButton';
import { TelegramPaperPlaneIcon } from './TelegramAuthModal';

export const LudoClubLogo: React.FC<{ size?: 'lg' | 'md' | 'sm' }> = ({
  size = 'lg',
}) => {
  const widthClass =
    size === 'lg' ? 'w-44' : size === 'md' ? 'w-36' : 'w-28';
  return (
    <div className={`${widthClass} mx-auto select-none`}>
      <svg
        viewBox="0 0 260 210"
        className="w-full h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
        role="img"
        aria-label="Ludo Club Emblem"
      >
        {/* Elliptical 3D Ludo Board Pedestal */}
        <ellipse
          cx="130"
          cy="155"
          rx="92"
          ry="34"
          fill="#4f46e5"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <ellipse
          cx="130"
          cy="148"
          rx="86"
          ry="28"
          fill="#ffffff"
          stroke="#1e293b"
          strokeWidth="3"
        />
        {/* Colored quadrants on pedestal */}
        <path d="M52,148 A78,24 0 0,1 130,124 L130,148 Z" fill="#facc15" />
        <path d="M130,124 A78,24 0 0,1 208,148 L130,148 Z" fill="#22c55e" />
        <path d="M130,148 L208,148 A78,24 0 0,1 130,172 Z" fill="#ef4444" />
        <path d="M52,148 L130,148 L130,172 A78,24 0 0,1 52,148 Z" fill="#0ea5e9" />

        {/* 4 Colorful Pawns Standing on the Board */}
        {/* Green Left Pawn */}
        <g transform="translate(68, 72) rotate(-14)">
          <path d="M-14,42 L14,42 L8,8 L-8,8 Z" fill="#22c55e" stroke="#ffffff" strokeWidth="3" />
          <circle cx="0" cy="0" r="12" fill="#22c55e" stroke="#ffffff" strokeWidth="3" />
        </g>
        {/* Yellow Top Pawn */}
        <g transform="translate(135, 42) rotate(6)">
          <path d="M-14,42 L14,42 L8,8 L-8,8 Z" fill="#facc15" stroke="#ffffff" strokeWidth="3" />
          <circle cx="0" cy="0" r="12" fill="#facc15" stroke="#ffffff" strokeWidth="3" />
        </g>
        {/* Red Right Pawn */}
        <g transform="translate(178, 66) rotate(16)">
          <path d="M-14,42 L14,42 L8,8 L-8,8 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
          <circle cx="0" cy="0" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
        </g>
        {/* Blue Front Pawn */}
        <g transform="translate(194, 92) rotate(24)">
          <path d="M-12,36 L12,36 L7,6 L-7,6 Z" fill="#0ea5e9" stroke="#ffffff" strokeWidth="3" />
          <circle cx="0" cy="0" r="10" fill="#0ea5e9" stroke="#ffffff" strokeWidth="3" />
        </g>

        {/* Central White 3D Die */}
        <g transform="translate(96, 56) rotate(-10)">
          <rect
            x="0"
            y="0"
            width="44"
            height="44"
            rx="9"
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="3.5"
          />
          <circle cx="12" cy="12" r="3.5" fill="#0f172a" />
          <circle cx="22" cy="22" r="4" fill="#ef4444" />
          <circle cx="32" cy="32" r="3.5" fill="#0f172a" />
          <circle cx="32" cy="12" r="3.5" fill="#0f172a" />
          <circle cx="12" cy="32" r="3.5" fill="#0f172a" />
        </g>

        {/* Bold LUDO Typography Banner */}
        <rect
          x="32"
          y="96"
          width="196"
          height="46"
          rx="12"
          fill="#0f172a"
          stroke="#ffffff"
          strokeWidth="4"
        />
        <text
          x="130"
          y="131"
          textAnchor="middle"
          fill="#facc15"
          fontFamily="Cinzel, sans-serif"
          fontWeight="900"
          fontSize="38"
          letterSpacing="3"
        >
          LUDO
        </text>

        {/* CLUB Pill Sub-banner */}
        <rect
          x="114"
          y="136"
          width="96"
          height="28"
          rx="8"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="3.5"
        />
        <text
          x="162"
          y="156"
          textAnchor="middle"
          fill="#0f172a"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="800"
          fontSize="18"
          letterSpacing="1.5"
        >
          CLUB
        </text>
      </svg>
    </div>
  );
};

interface AuthSplashViewProps {
  onLoginSuccess: (provider: 'telegram' | 'google' | 'facebook' | 'guest') => void;
  onOpenTelegramLogin: () => void;
}

export const AuthSplashView: React.FC<AuthSplashViewProps> = ({
  onLoginSuccess,
  onOpenTelegramLogin,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center px-6 py-8 text-center overflow-hidden">
      <div className="mt-4">
        <LudoClubLogo size="lg" />
      </div>

      <div className="w-full max-w-[290px] space-y-3 z-10">
        <p className="text-base font-bold italic text-white drop-shadow">
          Telegram Bot Arena · <span className="text-amber-300">$10 Free</span>
        </p>

        {/* Featured Telegram Bot Login Button */}
        <button
          type="button"
          data-testid="auth-telegram-login-btn"
          onClick={onOpenTelegramLogin}
          className="w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#38bdf8] hover:to-[#2AABEE] border-2 border-white/80 px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(42,171,238,0.45)] transition-transform active:scale-95 cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-white text-[#2AABEE] flex items-center justify-center shrink-0">
            <TelegramPaperPlaneIcon className="w-4 h-4" />
          </span>
          <span>Login with Telegram Bot</span>
        </button>

        <button
          type="button"
          onClick={() => onLoginSuccess('google')}
          className="w-full min-h-[44px] flex items-center justify-center gap-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border-2 border-sky-400/60 px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-white text-slate-900 font-extrabold flex items-center justify-center text-xs">
            G
          </span>
          <span>Sign up with Google</span>
        </button>

        <button
          type="button"
          onClick={() => onLoginSuccess('facebook')}
          className="w-full min-h-[44px] flex items-center justify-center gap-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border-2 border-sky-400/60 px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">
            f
          </span>
          <span>Sign up with Facebook</span>
        </button>

        <button
          type="button"
          data-start="true"
          onClick={() => onLoginSuccess('guest')}
          className="w-full min-h-[42px] flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 text-xs font-extrabold shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Quick Play Now</span>
        </button>
      </div>

      {/* Bottom Right Golden Coin Bag Illustration */}
      <div className="w-full flex items-end justify-between pt-2">
        <div className="text-left text-[11px] text-slate-300/80">
          Telegram Bot & iOS / Android
        </div>
        <svg
          viewBox="0 0 120 110"
          className="w-24 h-24 drop-shadow-xl"
          aria-hidden="true"
        >
          <ellipse cx="60" cy="96" rx="46" ry="10" fill="rgba(0,0,0,0.4)" />
          <path
            d="M35,34 C20,50 18,86 36,94 C52,100 78,100 90,92 C104,82 98,50 82,34 Z"
            fill="#eab308"
            stroke="#fef08a"
            strokeWidth="2.5"
          />
          <path
            d="M44,16 L74,16 L66,34 L50,34 Z"
            fill="#ca8a04"
            stroke="#fef08a"
            strokeWidth="2"
          />
          <circle cx="58" cy="66" r="18" fill="#ca8a04" opacity="0.35" />
          <text
            x="58"
            y="74"
            textAnchor="middle"
            fill="#713f12"
            fontWeight="900"
            fontSize="24"
          >
            ₹
          </text>
          {/* Stack of Gold Coins */}
          <circle cx="88" cy="86" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="100" cy="90" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="76" cy="92" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

interface HomeLobbyViewProps {
  playerName: string;
  telegramUser: TelegramUserProfile | null;
  coins: number;
  isMicEnabled: boolean;
  onSelectModeCard: (
    mode: 'single_vs_bots' | 'online_room' | 'private_room' | 'pass_and_play'
  ) => void;
  onOpenWalletModal: () => void;
  onOpenLeaderboardModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenRoomDrawer: () => void;
  onOpenThemesModal: () => void;
  onOpenTelegramModal: () => void;
  onToggleMic: () => void;
}

export const HomeLobbyView: React.FC<HomeLobbyViewProps> = ({
  playerName,
  telegramUser,
  coins,
  isMicEnabled,
  onSelectModeCard,
  onOpenWalletModal,
  onOpenLeaderboardModal,
  onOpenSettingsModal,
  onOpenRoomDrawer,
  onOpenThemesModal,
  onOpenTelegramModal,
  onToggleMic,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between pb-4 overflow-hidden">
      {/* Top Bar matching Screen 2 of Screenshot + Telegram Identity */}
      <div>
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/85 border-b-2 border-lime-400/80">
          {/* Left Avatar + Name + Telegram Handle */}
          <button
            type="button"
            onClick={onOpenTelegramModal}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
            aria-label="Open Telegram Bot Profile"
          >
            <div className="relative w-9 h-9 rounded-full bg-[#2AABEE] border-2 border-white flex items-center justify-center shadow shrink-0">
              <svg viewBox="0 0 36 36" className="w-7 h-7" aria-hidden="true">
                <circle cx="18" cy="13" r="6" fill="#fde68a" />
                <path d="M8,32 C8,23 28,23 28,32 Z" fill="#1e293b" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2AABEE] border border-white flex items-center justify-center text-white">
                <TelegramPaperPlaneIcon className="w-2.5 h-2.5" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate group-hover:text-sky-300">
                {playerName}
              </div>
              <div className="text-[10px] font-mono text-sky-300 truncate">
                {telegramUser
                  ? `${formatTelegramHandle(telegramUser)} · TG`
                  : 'Tap to Login via Telegram'}
              </div>
            </div>
          </button>

          {/* Right Coins Pill + Green Plus Button */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-lime-400/60 pl-2.5 pr-1 py-1">
            <span className="text-amber-400 text-xs">🪙</span>
            <span
              data-testid="lobby-coin-balance"
              className="text-xs font-extrabold text-white font-mono tabular-nums px-1"
            >
              {coins}
            </span>
            <button
              type="button"
              onClick={onOpenWalletModal}
              className="w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
              aria-label="Add Coins"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Side Quick Action Mini Squares (Left & Right under Header) */}
        <div className="flex items-start justify-between px-4 pt-3">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onToggleMic}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
              aria-label={isMicEnabled ? 'Mute Voice Mic' : 'Enable Voice Mic'}
            >
              <div
                className={`w-9 h-9 rounded-xl border-2 border-lime-400 flex items-center justify-center shadow ${
                  isMicEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-700 text-white'
                }`}
              >
                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </div>
              <span className="text-[10px] font-semibold text-slate-200">
                Voice
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenRoomDrawer}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
              aria-label="Open Room Chat"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-600 border-2 border-lime-400 text-white flex items-center justify-center shadow">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-200">
                Room
              </span>
            </button>
          </div>

          {/* Center Logo */}
          <div className="-mt-1">
            <LudoClubLogo size="sm" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenThemesModal}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
              aria-label="Customize Board Themes and Skins"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-600 border-2 border-lime-400 text-white flex items-center justify-center shadow">
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-200">
                Themes
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenWalletModal}
              className="flex flex-col items-center gap-0.5 cursor-pointer"
              aria-label="Transaction History"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-600 border-2 border-lime-400 text-white flex items-center justify-center shadow">
                <History className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-slate-200">
                History
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Center 2x2 Big Colorful Game Mode Grid (Matching Screen 2 of Reference) */}
      <div className="px-8 my-auto">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-w-[270px] mx-auto">
          {/* 1. Single Player (Yellow Tile) */}
          <button
            type="button"
            data-start="true"
            onClick={() => onSelectModeCard('single_vs_bots')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-24 h-20 rounded-2xl bg-amber-300 group-hover:bg-amber-200 border-b-4 border-amber-500 shadow-lg flex items-center justify-center transition-transform active:scale-95">
              <svg viewBox="0 0 48 48" className="w-11 h-11" aria-hidden="true">
                <circle cx="24" cy="14" r="7" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
                <path
                  d="M14,38 L34,38 L29,21 L19,21 Z"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <span className="text-xs font-bold text-white drop-shadow">
              Single Player
            </span>
          </button>

          {/* 2. Multiplayer (Light Blue Tile) */}
          <button
            type="button"
            onClick={() => onSelectModeCard('online_room')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-24 h-20 rounded-2xl bg-sky-300 group-hover:bg-sky-200 border-b-4 border-sky-500 shadow-lg flex items-center justify-center transition-transform active:scale-95">
              <svg viewBox="0 0 56 48" className="w-12 h-11" aria-hidden="true">
                <circle cx="20" cy="15" r="6" fill="#facc15" stroke="#0f172a" strokeWidth="2.2" />
                <path d="M11,37 L29,37 L25,21 L15,21 Z" fill="#facc15" stroke="#0f172a" strokeWidth="2.2" />
                <circle cx="35" cy="15" r="6" fill="#fb923c" stroke="#0f172a" strokeWidth="2.2" />
                <path d="M26,37 L44,37 L40,21 L30,21 Z" fill="#fb923c" stroke="#0f172a" strokeWidth="2.2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white drop-shadow">
              Multiplayer
            </span>
          </button>

          {/* 3. Private Room (Pink/Coral Tile) */}
          <button
            type="button"
            onClick={() => onSelectModeCard('private_room')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-24 h-20 rounded-2xl bg-rose-400 group-hover:bg-rose-300 border-b-4 border-rose-600 shadow-lg flex items-center justify-center transition-transform active:scale-95">
              <svg viewBox="0 0 52 48" className="w-12 h-11" aria-hidden="true">
                <circle cx="20" cy="14" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.2" />
                <path d="M11,36 L29,36 L25,20 L15,20 Z" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.2" />
                <rect x="27" y="22" width="16" height="14" rx="3" fill="#fde047" stroke="#0f172a" strokeWidth="2.2" />
                <path d="M31,22 V18 A4,4 0 0,1 39,18 V22" fill="none" stroke="#0f172a" strokeWidth="2.2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white drop-shadow">
              Private
            </span>
          </button>

          {/* 4. Pass & Play (Orange Tile) */}
          <button
            type="button"
            onClick={() => onSelectModeCard('pass_and_play')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-24 h-20 rounded-2xl bg-orange-400 group-hover:bg-orange-300 border-b-4 border-orange-600 shadow-lg flex items-center justify-center transition-transform active:scale-95">
              <svg viewBox="0 0 60 48" className="w-13 h-11" aria-hidden="true">
                <circle cx="17" cy="16" r="5.5" fill="#22c55e" stroke="#0f172a" strokeWidth="2" />
                <path d="M9,36 L25,36 L22,22 L12,22 Z" fill="#22c55e" stroke="#0f172a" strokeWidth="2" />
                <circle cx="43" cy="16" r="5.5" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
                <path d="M35,36 L51,36 L48,22 L38,22 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
                <circle cx="30" cy="14" r="6" fill="#0ea5e9" stroke="#0f172a" strokeWidth="2" />
                <path d="M21,38 L39,38 L35,21 L25,21 Z" fill="#0ea5e9" stroke="#0f172a" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white drop-shadow">
              Pass & Play
            </span>
          </button>
        </div>

        {/* Cross-Platform Install Pill below grid */}
        <div className="mt-4 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>

      {/* Bottom 4 Square Green/Gold Outlined Icon Buttons (Matching Screen 2 of Reference) */}
      <div className="px-6 pt-2 flex items-center justify-around">
        <button
          type="button"
          onClick={onOpenLeaderboardModal}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-12 h-11 rounded-xl bg-emerald-700 group-hover:bg-emerald-600 border-2 border-lime-400 flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">
            LeaderBoard
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenWalletModal}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-12 h-11 rounded-xl bg-emerald-700 group-hover:bg-emerald-600 border-2 border-lime-400 flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">
            Wallet
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSettingsModal}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-12 h-11 rounded-xl bg-emerald-700 group-hover:bg-emerald-600 border-2 border-lime-400 flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">
            Settings
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenRoomDrawer}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-12 h-11 rounded-xl bg-emerald-700 group-hover:bg-emerald-600 border-2 border-lime-400 flex items-center justify-center shadow-lg">
            <Share2 className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">
            Share Room
          </span>
        </button>
      </div>
    </div>
  );
};

interface ColorAndStakeSetupViewProps {
  selectedColor: PlayerColor;
  onSelectColor: (c: PlayerColor) => void;
  selectedMode: 'single_vs_bots' | 'online_room' | 'private_room' | 'pass_and_play';
  roomCode: string;
  onStartWithStake: (entryCoins: number, winCoins: number) => void;
  onJoinPrivateRoom: (code: string) => void;
  onBack: () => void;
}

const STAKE_CARDS = [
  { entry: 0, win: 50 },
  { entry: 10, win: 20 },
  { entry: 25, win: 50 },
  { entry: 50, win: 100 },
  { entry: 100, win: 200 },
  { entry: 250, win: 500 },
  { entry: 500, win: 1000 },
  { entry: 1000, win: 2000 },
  { entry: 2500, win: 5000 },
];

export const ColorAndStakeSetupView: React.FC<ColorAndStakeSetupViewProps> = ({
  selectedColor,
  onSelectColor,
  selectedMode,
  roomCode,
  onStartWithStake,
  onJoinPrivateRoom,
  onBack,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const colorOptions: { color: PlayerColor; hex: string; label: string }[] = [
    { color: 'yellow', hex: '#facc15', label: 'Yellow' },
    { color: 'red', hex: '#ef4444', label: 'Red' },
    { color: 'green', hex: '#22c55e', label: 'Green' },
    { color: 'blue', hex: '#0ea5e9', label: 'Blue' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-center px-5 py-6 space-y-4 overflow-y-auto">
      {/* Top Box: SELECT YOUR COLOR (Matching Screen 3 of Reference) */}
      <div className="rounded-xl bg-[#182c25]/95 border-2 border-lime-400/75 p-4 shadow-xl">
        <h2 className="text-center text-xs font-extrabold uppercase tracking-wider text-white mb-3">
          Select Your Color
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map((item) => {
            const isSelected = selectedColor === item.color;
            return (
              <button
                key={item.color}
                type="button"
                onClick={() => onSelectColor(item.color)}
                className="flex flex-col items-center gap-2 py-1 cursor-pointer"
                aria-label={`Select ${item.label} Pawn`}
              >
                <svg viewBox="0 0 36 48" className="w-8 h-10" aria-hidden="true">
                  <circle
                    cx="18"
                    cy="12"
                    r="8"
                    fill={item.hex}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <path
                    d="M8,42 L28,42 L23,20 L13,20 Z"
                    fill={item.hex}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </svg>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-white' : 'border-slate-400/60'
                  }`}
                  style={{
                    backgroundColor: isSelected ? item.hex : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Private Room Code Join / Create Box if Private mode is selected */}
      {selectedMode === 'private_room' && (
        <div className="rounded-xl bg-[#182c25]/95 border-2 border-lime-400/75 p-3.5 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Your Room Code:</span>
            </span>
            <span className="font-mono font-extrabold text-amber-300 tracking-widest">
              {roomCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="Enter Friend's Code"
              aria-label="Friend Private Room Code"
              className="w-full rounded-lg bg-slate-950/90 border border-lime-400/50 px-3 py-1.5 text-xs font-mono uppercase text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (joinCodeInput.trim().length >= 4) {
                  onJoinPrivateRoom(joinCodeInput.trim().toUpperCase());
                }
              }}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 whitespace-nowrap cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* Bottom Box: SELECT GAME 3x3 Stake Grid (Matching Screen 3 of Reference) */}
      <div className="rounded-xl bg-[#182c25]/95 border-2 border-lime-400/75 p-4 shadow-xl space-y-3">
        <h2 className="text-center text-xs font-extrabold uppercase tracking-wider text-white">
          Select Game
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {STAKE_CARDS.map((card, i) => (
            <button
              key={card.entry}
              type="button"
              data-testid={`stake-card-${i}`}
              data-start={i === 0 ? 'true' : undefined}
              onClick={() => onStartWithStake(card.entry, card.win)}
              className="rounded-xl bg-[#1f1624] hover:bg-[#2d1f33] border-2 border-lime-400/70 p-2 flex flex-col items-center gap-1 shadow transition-transform active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-300">
                <span>🪙</span>
                <span>Win</span>
              </div>
              <div className="w-full rounded bg-emerald-500 text-slate-950 text-[11px] font-extrabold font-mono tabular-nums py-0.5 text-center">
                {card.win}
              </div>
              <div className="text-[10px] font-semibold text-slate-300 font-mono tabular-nums">
                Entry {card.entry === 0 ? 'Free' : card.entry}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Back Button matching Screen 3 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-500 text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
          aria-label="Back to Home Lobby"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};
