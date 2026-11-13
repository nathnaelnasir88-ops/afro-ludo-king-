import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Info,
  Trophy,
  Mic,
  MicOff,
  MessageSquare,
  Box,
  LayoutGrid,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  COLOR_CONFIG,
  type LudoMatchState,
  type PlayerColor,
} from '../game/ludoRules';
import type { BoardThemeId, TokenSkinId } from '../game/storeCatalog';
import { ClassicLudoBoard2D } from './ClassicLudoBoard2D';
import { LudoBoard3D } from './LudoBoard3D';
import {
  formatTelegramHandle,
  type TelegramUserProfile,
} from '../game/telegramAuth';
import { TelegramPaperPlaneIcon } from './TelegramAuthModal';

interface PhoneMatchScreenProps {
  matchState: LudoMatchState;
  telegramUser: TelegramUserProfile | null;
  winPrizeCoins: number;
  coins: number;
  themeId: BoardThemeId;
  skinId: TokenSkinId;
  isMicEnabled: boolean;
  onRollDice: () => void;
  onSelectToken: (color: PlayerColor, tokenIndex: number) => void;
  onToggleMic: () => void;
  onOpenLobby: () => void;
  onOpenWallet: () => void;
  onOpenThemes: () => void;
  onOpenSettings: () => void;
  onOpenRoomChat: () => void;
  onOpenTelegramLogin: () => void;
  onPauseOrMenu: () => void;
}

const PlayerCornerPod: React.FC<{
  name: string;
  handleBadge?: string;
  color: PlayerColor;
  isTurn: boolean;
  statusLabel: string;
  align?: 'left' | 'right';
  onClick?: () => void;
}> = ({
  name,
  handleBadge,
  color,
  isTurn,
  statusLabel,
  align = 'left',
  onClick,
}) => {
  const bgMap: Record<PlayerColor, string> = {
    red: '#e11d48',
    green: '#16a34a',
    yellow: '#eab308',
    blue: '#0284c7',
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl bg-slate-950/85 border px-2.5 py-1.5 shadow-lg ${
        isTurn
          ? 'border-amber-300 ring-2 ring-amber-400/60'
          : 'border-slate-700/80'
      } ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'} ${
        onClick ? 'cursor-pointer hover:border-sky-400' : ''
      }`}
    >
      <div
        className="relative w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center shadow overflow-hidden shrink-0"
        style={{ backgroundColor: bgMap[color] }}
      >
        <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
          <path d="M8,46 C8,33 40,33 40,46 Z" fill="#1e3a8a" />
          <circle cx="24" cy="20" r="10" fill="#fde68a" />
          <path d="M14,18 C14,9 34,9 34,18 C31,14 17,14 14,18 Z" fill="#27272a" />
          <path d="M16,22 C16,30 32,30 32,22 C28,25 20,25 16,22 Z" fill="#27272a" />
        </svg>
      </div>
      <div className="leading-tight min-w-0">
        <div className="text-xs font-extrabold text-white truncate max-w-[100px]">
          {name}
        </div>
        {handleBadge && (
          <div className="text-[9px] font-mono text-sky-300 truncate max-w-[100px]">
            {handleBadge}
          </div>
        )}
        <div
          className={`text-[9px] font-bold uppercase tracking-wide ${
            isTurn ? 'text-amber-300' : 'text-slate-400'
          }`}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
};

export const PhoneMatchScreen: React.FC<PhoneMatchScreenProps> = ({
  matchState,
  telegramUser,
  winPrizeCoins,
  coins,
  themeId,
  skinId,
  isMicEnabled,
  onRollDice,
  onSelectToken,
  onToggleMic,
  onOpenLobby,
  onOpenWallet,
  onOpenThemes,
  onOpenRoomChat,
  onOpenTelegramLogin,
  onPauseOrMenu,
}) => {
  const [boardViewMode, setBoardViewMode] = useState<'2d' | '3d'>('3d');
  const [showRulesTip, setShowRulesTip] = useState(false);

  // Cinematic Banner for Unchain ("Get out of the chain") & Killing ("Capture")
  const [cinematicBanner, setCinematicBanner] = useState<{
    id: number;
    type: 'unchain' | 'kill' | 'goal';
    title: string;
    subtitle: string;
  } | null>(null);
  const lastMoveTimestampRef = useRef<number>(0);

  useEffect(() => {
    const lm = matchState.lastMove;
    if (!lm || lm.timestamp === lastMoveTimestampRef.current) return;
    lastMoveTimestampRef.current = lm.timestamp;

    const actorName = matchState.players[lm.player].name;
    const stepDiff = Math.max(1, lm.toStep - Math.max(0, lm.fromStep));

    if (lm.fromStep === -1 && lm.toStep === 0) {
      setCinematicBanner({
        id: lm.timestamp,
        type: 'unchain',
        title: '⛓️ BROKEN OUT OF THE CHAIN!',
        subtitle: `${actorName} unlocked Checker #${lm.tokenIndex + 1} onto the track!`,
      });
    } else if (lm.capturedToken) {
      // Show the Knockout banner right as the walking checker reaches the enemy
      const victimName = COLOR_CONFIG[lm.capturedToken.color].label;
      const timer = window.setTimeout(() => {
        setCinematicBanner({
          id: lm.timestamp,
          type: 'kill',
          title: '⚔️ CINEMATIC KNOCKOUT!',
          subtitle: `${actorName} crushed ${victimName} #${lm.capturedToken!.tokenIndex + 1} back to the chain!`,
        });
      }, Math.max(0, (stepDiff - 1) * 150));
      return () => window.clearTimeout(timer);
    } else if (lm.reachedGoal) {
      setCinematicBanner({
        id: lm.timestamp,
        type: 'goal',
        title: '👑 HOME SANCTUARY REACHED!',
        subtitle: `${actorName} crowned Checker #${lm.tokenIndex + 1}!`,
      });
    }
  }, [matchState.lastMove, matchState.players]);

  useEffect(() => {
    if (!cinematicBanner) return;
    const timer = window.setTimeout(() => {
      setCinematicBanner(null);
    }, 1750);
    return () => window.clearTimeout(timer);
  }, [cinematicBanner]);

  const activeColor = matchState.currentTurn;
  const activePlayer = matchState.players[activeColor];
  const isRedTurn = activeColor === 'red';
  const canRoll =
    matchState.turnPhase === 'WAIT_ROLL' &&
    !activePlayer.isBot &&
    !matchState.winner;
  const canMove =
    matchState.turnPhase === 'WAIT_MOVE' &&
    !activePlayer.isBot &&
    !matchState.winner;

  const topOpponentColor: PlayerColor =
    activeColor !== 'red' ? activeColor : 'yellow';
  const topOpponent = matchState.players[topOpponentColor];

  return (
    <div className="relative w-full h-full flex flex-col justify-between px-3 py-2.5 overflow-hidden select-none">
      {/* 1. Top Navigation & Mode Bar */}
      <div className="flex items-center justify-between gap-1.5 z-20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="match-back-button"
            onClick={onOpenLobby}
            className="px-2.5 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 border-2 border-sky-200 flex items-center gap-1 text-white text-xs font-extrabold shadow-md cursor-pointer"
            aria-label="Open Mode Lobby"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Modes</span>
          </button>

          <button
            type="button"
            onClick={onPauseOrMenu}
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 border-2 border-sky-300/70 flex items-center justify-center text-white shadow-md cursor-pointer"
            aria-label="Pause Game [P]"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setBoardViewMode((m) => (m === '2d' ? '3d' : '2d'))}
            className={`px-2.5 h-9 rounded-xl border-2 flex items-center gap-1 text-xs font-extrabold shadow-md cursor-pointer ${
              boardViewMode === '3d'
                ? 'bg-amber-400 border-white text-slate-950'
                : 'bg-slate-900/90 border-amber-400/80 text-amber-300'
            }`}
            aria-label="Toggle 2D or 3D WebGL View"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{boardViewMode === '3d' ? '3D Board' : '2.5D Map'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenThemes}
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 border-2 border-lime-400/70 flex items-center justify-center text-amber-300 shadow-md cursor-pointer"
            aria-label="Customize Board Themes and Skins"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Right Wallet & Trophy Prize */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="open-wallet-button"
            onClick={onOpenWallet}
            className="flex items-center gap-1 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-lime-400/70 px-2 py-1.5 shadow cursor-pointer"
            aria-label="Open Wallet and Payment Gateway"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span
              data-testid="hud-coin-balance"
              className="text-xs font-extrabold text-white font-mono tabular-nums"
            >
              {coins}
            </span>
          </button>

          <div className="flex items-center gap-1 rounded-xl bg-slate-950/85 border border-amber-400/60 px-2 py-1 shadow">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-right leading-none">
              <div className="text-[8px] font-bold text-slate-300">Win</div>
              <div className="text-[11px] font-extrabold text-amber-300 font-mono tabular-nums">
                {winPrizeCoins}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRulesTip && (
        <div className="z-30 rounded-xl bg-[#182c25] border border-lime-400 px-3 py-1.5 text-[11px] text-slate-100 flex items-center justify-between">
          <span>Roll 6 to break out of the chain! Checkers walk step-by-step & knock out rivals.</span>
          <button
            type="button"
            onClick={() => setShowRulesTip(false)}
            className="underline font-bold ml-2 text-amber-300 cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 2. Top Opponent Status Row + Telegram Bot Login Pill */}
      <div className="flex items-center justify-between px-1 z-20 gap-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span>
              Room: <span className="font-mono text-amber-300">{matchState.roomCode}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowRulesTip((s) => !s)}
              className="text-sky-300 hover:text-white cursor-pointer"
              aria-label="Match Rules Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            data-testid="telegram-login-pill"
            onClick={onOpenTelegramLogin}
            className="flex items-center gap-1.5 rounded-lg bg-[#2AABEE]/25 hover:bg-[#2AABEE]/40 border border-[#2AABEE] px-2 py-1 text-[10px] font-extrabold text-white shadow cursor-pointer w-fit"
            aria-label="Login with Telegram Information"
          >
            <TelegramPaperPlaneIcon className="w-3.5 h-3.5 text-[#2AABEE]" />
            <span>
              {telegramUser
                ? `${formatTelegramHandle(telegramUser)}`
                : 'Telegram Login'}
            </span>
          </button>
        </div>

        <PlayerCornerPod
          name={topOpponent.name}
          color={topOpponentColor}
          isTurn={activeColor === topOpponentColor}
          statusLabel={
            activeColor === topOpponentColor
              ? 'Rolling in Center...'
              : 'Waiting'
          }
          align="right"
        />
      </div>

      {/* 3. Center Square Ludo Map with 3D Checkers, Center Rolling Dice & Cinematic Banner */}
      <div className="relative w-full my-auto flex items-center justify-center z-10 py-1">
        {/* Cinematic Unchain / Knockout Callout Overlay */}
        {cinematicBanner && (
          <div
            data-testid="cinematic-event-banner"
            className={`pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-[330px] rounded-xl border-2 px-3 py-2 text-center shadow-[0_12px_30px_rgba(0,0,0,0.85)] animate-bounce ${
              cinematicBanner.type === 'kill'
                ? 'bg-rose-950/95 border-amber-300 text-white'
                : cinematicBanner.type === 'unchain'
                  ? 'bg-emerald-950/95 border-amber-300 text-white'
                  : 'bg-amber-950/95 border-amber-300 text-white'
            }`}
          >
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              {cinematicBanner.title}
            </div>
            <div className="text-[11px] font-semibold text-slate-100 truncate">
              {cinematicBanner.subtitle}
            </div>
          </div>
        )}

        {boardViewMode === '2d' ? (
          <ClassicLudoBoard2D
            matchState={matchState}
            themeId={themeId}
            canRoll={canRoll}
            onRollDice={onRollDice}
            onSelectToken={onSelectToken}
          />
        ) : (
          <div
            className="relative w-full max-w-[368px] mx-auto rounded-2xl overflow-hidden border-4 border-amber-400 shadow-[0_14px_34px_rgba(0,0,0,0.75)] bg-slate-950"
            style={{ aspectRatio: '1 / 1', minHeight: '308px' }}
          >
            <LudoBoard3D
              gameState="playing"
              matchState={matchState}
              themeId={themeId}
              skinId={skinId}
              cameraPreset="isometric"
              onSelectToken={onSelectToken}
              onRollDiceClick={onRollDice}
            />

            {/* Floating Center Dice Tap Prompt in 3D Mode */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                data-testid="center-board-dice"
                disabled={!canRoll}
                onClick={onRollDice}
                aria-label="Roll 3D Dice in Center of Board"
                className={`pointer-events-auto mt-14 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-lg border transition-transform ${
                  canRoll
                    ? 'bg-amber-400 text-slate-950 border-white animate-bounce cursor-pointer active:scale-95'
                    : 'bg-slate-950/85 text-amber-300 border-amber-400/60 cursor-default'
                }`}
              >
                {canRoll
                  ? 'TAP DICE'
                  : matchState.diceValue
                    ? `ROLLED ${matchState.diceValue}`
                    : 'CENTER DICE'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Player Status + Quick Checker Move Bar */}
      <div className="flex items-center justify-between px-1 z-20 gap-2">
        <div className="flex items-center gap-2">
          <PlayerCornerPod
            name={matchState.players.red.name}
            handleBadge={
              telegramUser
                ? formatTelegramHandle(telegramUser)
                : 'Tap for Telegram'
            }
            color="red"
            isTurn={isRedTurn}
            statusLabel={
              canRoll
                ? 'Tap Center Dice!'
                : canMove
                  ? 'Pick a Checker'
                  : 'Waiting'
            }
            align="left"
            onClick={onOpenTelegramLogin}
          />

          <button
            type="button"
            data-testid="roll-dice-button"
            disabled={!canRoll}
            onClick={onRollDice}
            className={`px-3 py-2 rounded-xl border-2 text-xs font-extrabold transition-transform cursor-pointer ${
              canRoll
                ? 'bg-amber-400 border-white text-slate-950 shadow-lg active:scale-95'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            aria-label="Roll Dice [Space]"
          >
            <div className="text-[9px] uppercase leading-none">Center Dice</div>
            <div
              data-testid="hud-dice-value"
              className="text-xs font-extrabold font-mono tabular-nums mt-0.5"
            >
              {matchState.diceValue ? `Rolled ${matchState.diceValue}` : 'ROLL'}
            </div>
          </button>
        </div>

        {/* Quick Checker Move Buttons (#1-#4) */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Move Checker Controls"
        >
          {[0, 1, 2, 3].map((idx) => {
            const isValid = canMove && matchState.validMoves.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                disabled={!isValid}
                onClick={() => onSelectToken(activeColor, idx)}
                className={`w-7 h-8 rounded-lg text-[11px] font-extrabold border transition-colors ${
                  isValid
                    ? 'bg-emerald-500 border-white text-slate-950 shadow cursor-pointer'
                    : 'bg-slate-900/70 border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                #{idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom Framed Turn Log / Voice & Private Room Bar */}
      <div className="rounded-xl border-2 border-lime-400/70 bg-slate-950/80 px-3 py-1.5 flex items-center justify-between gap-2 z-20">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wide">
            Turn #{matchState.turnCount} · {activePlayer.name}
          </div>
          <div
            data-testid="hud-action-log"
            className="text-[11px] text-slate-200 truncate"
          >
            {matchState.actionLog[0]}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMic}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer ${
              isMicEnabled
                ? 'bg-emerald-500 border-lime-200 text-slate-950'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            aria-label={
              isMicEnabled ? 'Mute Voice Chat [V]' : 'Enable Voice Chat [V]'
            }
          >
            {isMicEnabled ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenRoomChat}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 flex items-center justify-center cursor-pointer"
            aria-label="Open Private Room and Chat [L]"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
