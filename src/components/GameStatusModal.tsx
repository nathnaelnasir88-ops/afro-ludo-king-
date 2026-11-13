import React from 'react';
import { Trophy, Play, RotateCcw, Home, PauseCircle } from 'lucide-react';
import { COLOR_CONFIG, type LudoMatchState } from '../game/ludoRules';

interface GameStatusModalProps {
  gameState: 'paused' | 'gameover';
  matchState: LudoMatchState;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const GameStatusModal: React.FC<GameStatusModalProps> = ({
  gameState,
  matchState,
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  const isVictory = gameState === 'gameover' && matchState.winner !== null;
  const winnerColor = matchState.winner ?? 'red';
  const winnerPlayer = matchState.players[winnerColor];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={gameState === 'paused' ? 'Match Paused' : 'Match Complete'}
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          {gameState === 'paused' ? (
            <PauseCircle className="w-7 h-7 text-amber-400 shrink-0" />
          ) : (
            <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
          )}
          <div>
            <h2 className="text-xl font-bold font-display tracking-wide">
              {gameState === 'paused'
                ? 'Arena Match Paused'
                : `${winnerPlayer.name} Triumphs!`}
            </h2>
            <p className="text-xs text-slate-400">
              {gameState === 'paused'
                ? `Room ${matchState.roomCode} · Press Esc or P to resume`
                : `Royal Ludo Grand Victory · +250 Winner Coins Credited`}
            </p>
          </div>
        </div>

        {/* 3 Tabular-Nums Stat Tiles */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Turns
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
              {matchState.turnCount}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Captures
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-300 mt-0.5">
              {matchState.players.red.captures}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Tokens Home
            </div>
            <div
              className="text-lg font-bold font-mono tabular-nums mt-0.5"
              style={{ color: COLOR_CONFIG[winnerColor].lightHex }}
            >
              {isVictory
                ? '4/4'
                : `${matchState.players[matchState.currentTurn].finishedCount}/4`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {gameState === 'paused' ? (
            <button
              type="button"
              onClick={onResume}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 px-4 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Resume Match [Esc]</span>
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 px-4 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          )}

          {gameState === 'paused' && (
            <button
              type="button"
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs py-2.5 px-4 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Match</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs py-2.5 px-4 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
