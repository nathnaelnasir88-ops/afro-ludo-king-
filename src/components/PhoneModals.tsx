import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Vibrate,
  MessageSquare,
  Share2,
  Mic,
  MicOff,
  Palette,
  Crown,
  Wallet,
  Check,
} from 'lucide-react';
import {
  BOARD_THEMES,
  TOKEN_SKINS,
  COIN_BUNDLES,
  type BoardThemeId,
  type TokenSkinId,
  type WalletState,
} from '../game/storeCatalog';

interface PhoneSettingsModalProps {
  isOpen: boolean;
  isMuted: boolean;
  isMicEnabled: boolean;
  roomCode: string;
  onClose: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onOpenChat: () => void;
  onOpenThemes: () => void;
  onLogout: () => void;
}

export const PhoneSettingsModal: React.FC<PhoneSettingsModalProps> = ({
  isOpen,
  isMuted,
  isMicEnabled,
  roomCode,
  onClose,
  onToggleMute,
  onToggleMic,
  onOpenChat,
  onOpenThemes,
  onLogout,
}) => {
  const [vibrationOn, setVibrationOn] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="relative w-full max-w-[340px] rounded-2xl bg-[#182c25] border-2 border-lime-400/85 shadow-2xl overflow-hidden text-white">
        {/* Header matching Screen 6 */}
        <div className="relative py-3 px-4 bg-[#1f382f] border-b border-lime-400/60 text-center">
          <h2 className="text-sm font-extrabold tracking-wide text-white">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2.5 w-6 h-6 rounded-full bg-emerald-700 hover:bg-emerald-600 border border-lime-400 flex items-center justify-center text-white cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Settings Rows */}
        <div className="p-4 space-y-2.5 text-xs font-bold">
          {/* 1. Sound */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Sound</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isMuted) onToggleMute();
                }}
                className={`w-7 h-7 rounded-full border border-lime-300 flex items-center justify-center cursor-pointer ${
                  !isMuted ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-900/60 text-white'
                }`}
                aria-label="Enable Sound"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isMuted) onToggleMute();
                }}
                className={`w-7 h-7 rounded-full border border-lime-300 flex items-center justify-center cursor-pointer ${
                  isMuted ? 'bg-rose-500 text-white' : 'bg-emerald-900/60 text-white'
                }`}
                aria-label="Mute Sound"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Vibration */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Vibration</span>
            <button
              type="button"
              onClick={() => setVibrationOn((v) => !v)}
              className={`w-7 h-7 rounded-full border border-lime-300 flex items-center justify-center cursor-pointer ${
                vibrationOn ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-900/60 text-white'
              }`}
              aria-label="Toggle Vibration"
            >
              <Vibrate className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Voice Chat */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Voice Chat</span>
            <button
              type="button"
              onClick={onToggleMic}
              className={`w-7 h-7 rounded-full border border-lime-300 flex items-center justify-center cursor-pointer ${
                isMicEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-900/60 text-white'
              }`}
              aria-label="Toggle Voice Microphone"
            >
              {isMicEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 4. Game Chat */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Game Chat</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChat();
              }}
              className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 border border-lime-300 flex items-center justify-center cursor-pointer"
              aria-label="Open Game Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5. Share Room Code */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Share ({roomCode})</span>
            <button
              type="button"
              onClick={handleShare}
              className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 border border-lime-300 flex items-center justify-center cursor-pointer"
              aria-label="Copy Room Code"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 6. Board Themes & Skins */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Themes & Skins</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenThemes();
              }}
              className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 border border-lime-300 text-[11px] font-extrabold cursor-pointer"
            >
              View
            </button>
          </div>

          {/* 7. Log Out */}
          <div className="flex items-center justify-between rounded-xl bg-[#243f35] border border-lime-400/50 px-3.5 py-2.5">
            <span>Log Out</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-lime-300 text-[11px] font-extrabold cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PhoneLeaderboardModalProps {
  isOpen: boolean;
  playerName: string;
  playerCoins: number;
  onClose: () => void;
}

export const PhoneLeaderboardModal: React.FC<PhoneLeaderboardModalProps> = ({
  isOpen,
  playerName,
  playerCoins,
  onClose,
}) => {
  const [period, setPeriod] = useState<'last_month' | 'all_time'>('last_month');

  if (!isOpen) return null;

  const entries = [
    { rank: 1, name: 'Rajdeep Banik', score: period === 'last_month' ? 4850 : 12400 },
    { rank: 2, name: playerName, score: playerCoins },
    { rank: 3, name: 'Zeeshan Ansari', score: period === 'last_month' ? 620 : 3900 },
    { rank: 4, name: 'Aarav Sharma', score: period === 'last_month' ? 540 : 2850 },
    { rank: 5, name: 'Priya Patel', score: period === 'last_month' ? 410 : 1920 },
  ].sort((a, b) => b.score - a.score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="LeaderBoard"
    >
      <div className="relative w-full max-w-[340px] rounded-2xl bg-[#182c25] border-2 border-lime-400/85 shadow-2xl overflow-hidden text-white">
        {/* Header matching Screen 7 */}
        <div className="relative py-3 px-4 bg-[#1f382f] border-b border-lime-400/60 text-center">
          <h2 className="text-sm font-extrabold tracking-wide text-white">
            LeaderBoard
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2.5 w-6 h-6 rounded-full bg-emerald-700 hover:bg-emerald-600 border border-lime-400 flex items-center justify-center text-white cursor-pointer"
            aria-label="Close LeaderBoard"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Period Filter Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPeriod('last_month')}
              className={`py-1.5 px-3 rounded-lg text-xs font-extrabold border cursor-pointer ${
                period === 'last_month'
                  ? 'bg-[#3b2110] border-amber-400 text-amber-300'
                  : 'bg-[#243f35] border-lime-400/40 text-slate-300'
              }`}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all_time')}
              className={`py-1.5 px-3 rounded-lg text-xs font-extrabold border cursor-pointer ${
                period === 'all_time'
                  ? 'bg-[#3b2110] border-amber-400 text-amber-300'
                  : 'bg-[#243f35] border-lime-400/40 text-slate-300'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Column Headers */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0d1915] border border-lime-400/40 text-[11px] font-bold text-amber-200">
            <span>Rank</span>
            <span>Name</span>
            <span>Coins</span>
          </div>

          {/* Golden Ranked Bars matching Screen 7 */}
          <div className="space-y-2">
            {entries.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-amber-200/80 shadow"
                style={{
                  background:
                    idx < 3
                      ? 'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)'
                      : '#422006',
                }}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold font-mono ${
                    idx < 3 ? 'bg-rose-600 text-white' : 'bg-slate-800 text-amber-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <span
                  className={`text-xs font-extrabold truncate max-w-[140px] ${
                    idx < 3 ? 'text-slate-950' : 'text-amber-100'
                  }`}
                >
                  {item.name}
                </span>
                <span
                  className={`text-xs font-extrabold font-mono tabular-nums ${
                    idx < 3 ? 'text-slate-950' : 'text-amber-300'
                  }`}
                >
                  🪙 {item.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PhoneWalletAndThemesModalProps {
  isOpen: boolean;
  initialTab: 'wallet' | 'themes';
  wallet: WalletState;
  onClose: () => void;
  onAddCoinsViaGateway: (amountCoins: number, method: string, identifier: string) => void;
  onWithdrawCoins: (amountCoins: number, method: string, identifier: string) => {
    success: boolean;
    error?: string;
  };
  onPurchaseOrEquipItem: (
    itemType: 'theme' | 'skin',
    itemId: BoardThemeId | TokenSkinId
  ) => { success: boolean; error?: string };
}

export const PhoneWalletAndThemesModal: React.FC<PhoneWalletAndThemesModalProps> = ({
  isOpen,
  initialTab,
  wallet,
  onClose,
  onAddCoinsViaGateway,
  onWithdrawCoins,
  onPurchaseOrEquipItem,
}) => {
  const [tab, setTab] = useState<'wallet' | 'themes'>(initialTab);
  const [method, setMethod] = useState<'UPI' | 'Paytm' | 'Bank A/C'>('UPI');
  const [amountInput, setAmountInput] = useState('500');
  const [accountInput, setAccountInput] = useState('player@okaxis');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(
    null
  );

  React.useEffect(() => {
    setTab(initialTab);
    setFeedback(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const numAmount = Math.max(0, parseInt(amountInput || '0', 10) || 0);
  const fee = 2;
  const totalWithFee = numAmount > 0 ? numAmount + fee : 0;

  const handleAddCoins = async () => {
    if (numAmount < 100 || numAmount > 9999) {
      setFeedback({ type: 'err', msg: 'Enter an amount between 100 and 9999.' });
      return;
    }
    if (accountInput.trim().length < 4) {
      setFeedback({
        type: 'err',
        msg: `Enter a valid ${method} identifier.`,
      });
      return;
    }
    onAddCoinsViaGateway(numAmount, method, accountInput.trim());
    setFeedback({
      type: 'ok',
      msg: `+${numAmount} Coins added via ${method} Payment Gateway!`,
    });
  };

  const handleWithdraw = () => {
    if (numAmount < 100 || numAmount > 9999) {
      setFeedback({ type: 'err', msg: 'Enter an amount between 100 and 9999.' });
      return;
    }
    if (accountInput.trim().length < 4) {
      setFeedback({
        type: 'err',
        msg: `Enter a valid ${method} account/ID.`,
      });
      return;
    }
    const res = onWithdrawCoins(totalWithFee, method, accountInput.trim());
    if (!res.success) {
      setFeedback({ type: 'err', msg: res.error || 'Insufficient balance.' });
    } else {
      setFeedback({
        type: 'ok',
        msg: `Claimed ${numAmount} Coins to ${accountInput.trim()}!`,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Claim Amount and Store"
    >
      <div className="relative w-full max-w-[348px] max-h-[88vh] flex flex-col rounded-2xl bg-[#182c25] border-2 border-lime-400/85 shadow-2xl overflow-hidden text-white">
        {/* Header matching Screen 5 of Screenshot */}
        <div className="relative flex items-center justify-between py-2.5 px-3.5 bg-[#1f382f] border-b border-lime-400/60">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 border border-lime-400 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-extrabold tracking-wide text-white">
            {tab === 'wallet' ? 'Claim Amount & Wallet' : 'Board Themes & Skins'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-emerald-700 hover:bg-emerald-600 border border-lime-400 flex items-center justify-center text-white cursor-pointer"
            aria-label="Close Wallet Modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mode Switcher Sub-Bar (Wallet / Themes) */}
        <div className="grid grid-cols-2 gap-1.5 px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              setTab('wallet');
              setFeedback(null);
            }}
            className={`py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer ${
              tab === 'wallet'
                ? 'bg-emerald-500 text-slate-950 border-lime-300'
                : 'bg-[#243f35] text-slate-200 border-lime-400/40'
            }`}
          >
            Wallet & Gateway
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('themes');
              setFeedback(null);
            }}
            className={`py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer ${
              tab === 'themes'
                ? 'bg-emerald-500 text-slate-950 border-lime-300'
                : 'bg-[#243f35] text-slate-200 border-lime-400/40'
            }`}
          >
            Themes & Skins
          </button>
        </div>

        {feedback && (
          <div
            className={`mx-4 mt-2.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
              feedback.type === 'ok'
                ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                : 'bg-rose-950 border-rose-400 text-rose-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <div className="p-4 overflow-y-auto space-y-3 text-xs">
          {tab === 'wallet' ? (
            <>
              {/* Payment Method Radio Row matching Screen 5 */}
              <div className="flex items-center justify-between px-1">
                {(['UPI', 'Paytm', 'Bank A/C'] as const).map((m) => (
                  <label
                    key={m}
                    className="flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="paymentMethodRadio"
                      checked={method === m}
                      onChange={() => setMethod(m)}
                      className="accent-lime-400"
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>

              {/* Balance Breakdown Box matching Screen 5 */}
              <div className="rounded-xl bg-[#203830] border border-lime-400/65 p-3 space-y-1 font-bold">
                <div className="flex justify-between text-slate-200">
                  <span>Deposit</span>
                  <span className="font-mono tabular-nums">{wallet.coins}</span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Win</span>
                  <span className="font-mono tabular-nums">250</span>
                </div>
                <div className="flex justify-between text-amber-300 pt-1 border-t border-lime-400/30">
                  <span>Total Balance</span>
                  <span
                    data-testid="wallet-total-balance"
                    className="font-mono tabular-nums"
                  >
                    {wallet.coins}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label
                  htmlFor="claim-amount-input"
                  className="block text-[11px] font-bold text-slate-200"
                >
                  Amount (min 100 - max 9999)
                </label>
                <input
                  id="claim-amount-input"
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-lg bg-[#2a473c] border border-lime-400/60 px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              {/* UPI / Account Input */}
              <div className="space-y-1">
                <label
                  htmlFor="claim-account-input"
                  className="block text-[11px] font-bold text-slate-200"
                >
                  {method} ID / Card Number
                </label>
                <input
                  id="claim-account-input"
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  placeholder={`Enter ${method} details`}
                  className="w-full rounded-lg bg-[#2a473c] border border-lime-400/60 px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              {/* Fee Summary Box matching Screen 5 */}
              <div className="rounded-xl bg-[#203830] border border-lime-400/65 p-3 space-y-1 text-[11px] font-bold">
                <div className="flex justify-between text-slate-200">
                  <span>Transaction Amt</span>
                  <span className="font-mono tabular-nums">{numAmount}</span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Gateway Fee</span>
                  <span className="font-mono tabular-nums">{fee}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-1 border-t border-lime-400/30">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{totalWithFee}</span>
                </div>
              </div>

              {/* Action Buttons: Add Coins & Withdraw */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAddCoins}
                  className="py-2 px-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow cursor-pointer"
                >
                  + Add Coins
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="py-2 px-3 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-lime-300 text-slate-950 font-extrabold text-xs shadow cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Board Themes</span>
                </h3>
                {Object.values(BOARD_THEMES).map((thm) => {
                  const isOwned = wallet.ownedThemes.includes(thm.id);
                  const isEq = wallet.equippedTheme === thm.id;
                  return (
                    <div
                      key={thm.id}
                      className="flex items-center justify-between rounded-xl bg-[#203830] border border-lime-400/50 p-2.5"
                    >
                      <div>
                        <div className="font-extrabold text-white">{thm.name}</div>
                        <div className="text-[10px] text-slate-300">
                          {isOwned ? 'Unlocked' : `${thm.priceCoins} Coins`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const r = onPurchaseOrEquipItem('theme', thm.id);
                          if (!r.success && r.error) {
                            setFeedback({ type: 'err', msg: r.error });
                          } else {
                            setFeedback({
                              type: 'ok',
                              msg: `Equipped ${thm.name}!`,
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                          isEq
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-amber-400 text-slate-950'
                        }`}
                      >
                        {isEq ? '✓ Active' : isOwned ? 'Equip' : `Buy (${thm.priceCoins})`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2 border-t border-lime-400/30">
                <h3 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Token Skins</span>
                </h3>
                {Object.values(TOKEN_SKINS).map((skn) => {
                  const isOwned = wallet.ownedSkins.includes(skn.id);
                  const isEq = wallet.equippedSkin === skn.id;
                  return (
                    <div
                      key={skn.id}
                      className="flex items-center justify-between rounded-xl bg-[#203830] border border-lime-400/50 p-2.5"
                    >
                      <div>
                        <div className="font-extrabold text-white">{skn.name}</div>
                        <div className="text-[10px] text-slate-300">
                          {isOwned ? 'Unlocked' : `${skn.priceCoins} Coins`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const r = onPurchaseOrEquipItem('skin', skn.id);
                          if (!r.success && r.error) {
                            setFeedback({ type: 'err', msg: r.error });
                          } else {
                            setFeedback({
                              type: 'ok',
                              msg: `Equipped ${skn.name}!`,
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                          isEq
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-amber-400 text-slate-950'
                        }`}
                      >
                        {isEq ? '✓ Active' : isOwned ? 'Equip' : `Buy (${skn.priceCoins})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
