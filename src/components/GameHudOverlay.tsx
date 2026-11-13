import React, { useState } from 'react';
import {
  Dices,
  Mic,
  MicOff,
  Users,
  Palette,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Coins,
  Camera,
} from 'lucide-react';
import {
  COLOR_CONFIG,
  PLAYER_ORDER,
  type LudoMatchState,
  type PlayerColor,
} from '../game/ludoRules';
import type { CameraPreset } from './LudoBoard3D';

interface GameHudOverlayProps {
  matchState: LudoMatchState;
  coins: number;
  isMuted: boolean;
  isMicEnabled: boolean;
  micLevel: number;
  cameraPreset: CameraPreset;
  dockCollapsed: boolean;
  onToggleDock: () => void;
  onRollDice: () => void;
  onSelectToken: (color: PlayerColor, tokenIndex: number) => void;
  onChangeCameraPreset: (preset: CameraPreset) => void;
  onToggleMic: () => void;
  onOpenRoomDrawer: () => void;
  onOpenStore: (tab?: 'themes' | 'skins' | 'coins') => void;
  onToggleMute: () => void;
  onPauseGame: () => void;
  onRestartMatch: () => void;
}

export const GameHudOverlay: React.FC<GameHudOverlayProps> = ({
  matchState,
  coins,
  isMuted,
  isMicEnabled,
  micLevel,
  cameraPreset,
  dockCollapsed,
  onToggleDock,
  onRollDice,
  onSelectToken,
  onChangeCameraPreset,
  onToggleMic,
  onOpenRoomDrawer,
  onOpenStore,
  onToggleMute,
  onPauseGame,
  onRestartMatch,
}) => {
  const activeColor = matchState.currentTurn;
  const activePlayer = matchState.players[activeColor];
  const activeConfig = COLOR_CONFIG[activeColor];
  const canHumanRoll =
    matchState.turnPhase === 'WAIT_ROLL' && !activePlayer.isBot && !matchState.winner;
  const canHumanMove =
    matchState.turnPhase === 'WAIT_MOVE' && !activePlayer.isBot && !matchState.winner;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Strip: Top-Left Status Cluster + Top-Right Utility Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Top-Left Cluster: Active Turn Banner + 4-House Progress Readout */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 rounded-xl bg-slate-950/92 border border-slate-800 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 shadow-xl max-w-full">
          {/* Active Turn Indicator */}
          <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-slate-800">
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill={activeConfig.hex}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <path d="M8 15l2-6 2 3 2-3 2 6H8z" fill="#ffffff" />
            </svg>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Turn #{matchState.turnCount} · {matchState.roomCode}
              </div>
              <div
                data-testid="hud-active-turn"
                className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[110px] sm:max-w-none"
              >
                {activePlayer.name}
              </div>
            </div>
          </div>

          {/* 4-House Goal Progress Pips (Tabular Numerals) */}
          <div className="hidden lg:flex items-center gap-2.5">
            {PLAYER_ORDER.map((color) => {
              const p = matchState.players[color];
              const cfg = COLOR_CONFIG[color];
              const isTurn = matchState.currentTurn === color;
              return (
                <div
                  key={color}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                    isTurn
                      ? 'bg-slate-900 border-amber-400/70'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" fill={cfg.hex} stroke="#0f172a" strokeWidth="1.5" />
                  </svg>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-200">
                    {p.finishedCount}/4
                  </span>
                </div>
              );
            })}
          </div>

          {/* Treasury Coin Counter */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenStore('coins');
            }}
            className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 px-2 py-1 text-xs font-bold text-amber-300 font-mono tabular-nums cursor-pointer shrink-0"
            aria-label="Open Royal Coin Treasury"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span data-testid="hud-coin-balance">{coins}</span>
          </button>
        </div>

        {/* Top-Right Compact Utility Icon Buttons */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-slate-950/92 border border-slate-800 p-1 sm:p-1.5 shadow-xl">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMic();
            }}
            className={`flex items-center gap-1.5 rounded-lg p-2 sm:px-2.5 sm:py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              isMicEnabled
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
            }`}
            aria-label={isMicEnabled ? 'Mute Voice Chat [V]' : 'Enable Voice Chat [V]'}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden md:inline">
              {isMicEnabled ? `Voice (${micLevel}%)` : 'Voice [V]'}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenRoomDrawer();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 p-2 sm:px-2.5 sm:py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            aria-label="Open Private Room and Chat [L]"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Room ({matchState.roomCode})</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenStore('themes');
            }}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 p-2 sm:px-2.5 sm:py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            aria-label="Open Store and Board Themes [B]"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Store [B]</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Sound Effects [M]' : 'Mute Sound Effects [M]'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestartMatch();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            aria-label="Restart Match [R]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPauseGame();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            aria-label="Pause Game [P]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Side-Flank Clutter) */}
      <div className="mx-auto w-full max-w-[920px] flex flex-col items-center pointer-events-none">
        {/* Collapse / Expand Zen Mode Tab */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleDock();
          }}
          className="pointer-events-auto flex items-center gap-1.5 rounded-t-xl bg-slate-950/95 border border-b-0 border-slate-800 px-4 py-1 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          aria-label={dockCollapsed ? 'Show Controls [H]' : 'Hide Controls [H]'}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls [H]</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full rounded-2xl bg-slate-950/95 border border-slate-800 p-3 sm:px-5 sm:py-3.5 shadow-2xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Primary Dice Action + Live Dice Readout */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!canHumanRoll}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRollDice();
                  }}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-transform whitespace-nowrap shrink-0 cursor-pointer ${
                    canHumanRoll
                      ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-lg'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Dices className="w-4 h-4" />
                  <span>
                    {canHumanRoll
                      ? 'Roll Dice [Space]'
                      : activePlayer.isBot
                      ? `${activePlayer.name} Thinking...`
                      : 'Select Token Below'}
                  </span>
                </button>

                <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-xs text-slate-400">Rolled</span>
                  <span
                    data-testid="hud-dice-value"
                    className="text-base font-bold font-mono tabular-nums text-amber-300"
                  >
                    {matchState.diceValue ?? '—'}
                  </span>
                </div>
              </div>

              {/* Token 1–4 Direct Tactical Buttons (Accessible & Touch-Friendly) */}
              <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label="Move Token Controls"
              >
                {[0, 1, 2, 3].map((tokenIdx) => {
                  const token = matchState.tokens[activeColor][tokenIdx];
                  const isValid =
                    canHumanMove && matchState.validMoves.includes(tokenIdx);
                  const statusLabel =
                    token.step === -1
                      ? 'Yard'
                      : token.step === 56
                      ? 'Home'
                      : `Step ${token.step}`;

                  return (
                    <button
                      key={tokenIdx}
                      type="button"
                      disabled={!isValid}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectToken(activeColor, tokenIdx);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        isValid
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 font-bold cursor-pointer shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      #{tokenIdx + 1} ({statusLabel})
                    </button>
                  );
                })}
              </div>

              {/* 3D Camera Preset Switcher */}
              <div
                className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1"
                role="group"
                aria-label="3D Camera View Preset"
              >
                <Camera className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:inline" />
                {(['isometric', 'top', 'orbital'] as CameraPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onChangeCameraPreset(preset);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      cameraPreset === preset
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Single-Line Live Match Chronicle Ticker */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span data-testid="hud-action-log" className="truncate text-slate-300">
                {matchState.actionLog[0]}
              </span>
              <span className="hidden md:inline text-slate-500 shrink-0 ml-4">
                Drag to Orbit · Scroll to Zoom · Click 3D Token or Press 1–4
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
