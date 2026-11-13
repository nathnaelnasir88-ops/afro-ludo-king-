import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Users,
  Copy,
  Check,
  Send,
  RefreshCw,
  X,
  Volume2,
} from 'lucide-react';
import { COLOR_CONFIG, PLAYER_ORDER, type LudoMatchState, type PlayerColor } from '../game/ludoRules';

interface ChatMessage {
  id: string;
  senderName: string;
  senderColor: PlayerColor;
  text: string;
  timestamp: string;
}

interface PrivateRoomAndVoiceDrawerProps {
  isOpen: boolean;
  matchState: LudoMatchState;
  isMicEnabled: boolean;
  micLevel: number;
  voiceStatusText: string;
  wsConnected: boolean;
  chatMessages: ChatMessage[];
  onClose: () => void;
  onToggleMic: () => void;
  onCreateNewPrivateRoom: () => void;
  onJoinRoomCode: (code: string) => void;
  onSendChatMessage: (text: string) => void;
}

const QUICK_VOICE_CALLOUTS = [
  'Need a 6 to deploy!',
  'Watch your back token!',
  'Star safe square secured!',
  'Well played, Commander!',
];

export const PrivateRoomAndVoiceDrawer: React.FC<PrivateRoomAndVoiceDrawerProps> = ({
  isOpen,
  matchState,
  isMicEnabled,
  micLevel,
  voiceStatusText,
  wsConnected,
  chatMessages,
  onClose,
  onToggleMic,
  onCreateNewPrivateRoom,
  onJoinRoomCode,
  onSendChatMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [chatText, setChatText] = useState('');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(matchState.roomCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = chatText.trim();
    if (!cleaned) return;
    onSendChatMessage(cleaned);
    setChatText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Private Multiplayer Room and Voice Chat Hub"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-display tracking-wide">
              Private Room & Voice Comms
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              {wsConnected ? 'WS REALTIME: CONNECTED' : 'LOCAL SYNC'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close Room Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Room Code & Join / Create Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Private Room Code</span>
                <button
                  type="button"
                  onClick={onCreateNewPrivateRoom}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>New Room</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span
                  data-testid="active-room-code"
                  className="text-2xl font-bold font-mono tracking-widest text-amber-300 tabular-nums"
                >
                  {matchState.roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2.5">
              <label
                htmlFor="drawer-join-code"
                className="block text-xs text-slate-400"
              >
                Switch to Friend&apos;s Private Room
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="drawer-join-code"
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="Enter 6-char code"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (joinInput.trim().length >= 4) {
                      onJoinRoomCode(joinInput.trim().toUpperCase());
                      setJoinInput('');
                    }
                  }}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Switch Room
                </button>
              </div>
            </div>
          </div>

          {/* WebRTC Voice Channel Control & dB Meter */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  WebRTC Spatial Voice Channel
                </span>
              </div>
              <p className="text-xs text-slate-400">{voiceStatusText}</p>
              {/* Live Audio Input Level Meter */}
              <div className="w-48 h-2 rounded-full bg-slate-800 overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-400 transition-transform duration-100 origin-left"
                  style={{
                    transform: `scaleX(${isMicEnabled ? Math.max(0.08, micLevel / 100) : 0})`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleMic}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMicEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isMicEnabled ? (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Voice Mic Active (Mute)</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Toggle Room Voice Channel</span>
                </>
              )}
            </button>
          </div>

          {/* 4-Player Seats Roster */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PLAYER_ORDER.map((color) => {
              const p = matchState.players[color];
              const cfg = COLOR_CONFIG[color];
              return (
                <div
                  key={color}
                  className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold" style={{ color: cfg.lightHex }}>
                      {color.toUpperCase()}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {p.isBot ? 'BOT' : 'HUMAN'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {p.name}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Live Room Chat & Tactical Callouts */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_VOICE_CALLOUTS.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => onSendChatMessage(phrase)}
                  className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>

            <div className="h-32 overflow-y-auto rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
              {chatMessages.map((m) => (
                <div key={m.id} className="text-xs leading-relaxed">
                  <span
                    className="font-bold mr-1.5"
                    style={{ color: COLOR_CONFIG[m.senderColor]?.lightHex || '#fbbf24' }}
                  >
                    {m.senderName}:
                  </span>
                  <span className="text-slate-200">{m.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Send room message or voice callout..."
                aria-label="Room chat message"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
