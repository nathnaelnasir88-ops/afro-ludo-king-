import React, { useEffect, useState } from 'react';
import {
  Send,
  X,
  CheckCircle2,
  Share2,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  buildTelegramBotShareUrl,
  detectTelegramLaunchContext,
  formatTelegramDisplayName,
  formatTelegramHandle,
  type TelegramUserProfile,
  type TelegramWebAppWindow,
} from '../game/telegramAuth';

interface TelegramAuthModalProps {
  isOpen: boolean;
  currentProfile: TelegramUserProfile | null;
  roomCode: string;
  onClose: () => void;
  onLoginSuccess: (profile: TelegramUserProfile) => void;
  onLogoutTelegram: () => void;
}

export const TelegramPaperPlaneIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const TelegramAuthModal: React.FC<TelegramAuthModalProps> = ({
  isOpen,
  currentProfile,
  roomCode,
  onClose,
  onLoginSuccess,
  onLogoutTelegram,
}) => {
  const [firstName, setFirstName] = useState(
    currentProfile?.firstName || 'Nathnael'
  );
  const [lastName, setLastName] = useState(
    currentProfile?.lastName || 'Nasir'
  );
  const [username, setUsername] = useState(
    currentProfile?.username || 'nathnael_tg'
  );
  const [telegramId, setTelegramId] = useState(
    currentProfile?.id ? String(currentProfile.id) : '648291035'
  );
  const [isPremium, setIsPremium] = useState(
    Boolean(currentProfile?.isPremium ?? true)
  );
  const [botUsername, setBotUsername] = useState('RoyalLudo3DBot');
  const [hasBotToken, setHasBotToken] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (currentProfile) {
      setFirstName(currentProfile.firstName);
      setLastName(currentProfile.lastName || '');
      setUsername(currentProfile.username || '');
      setTelegramId(String(currentProfile.id));
      setIsPremium(Boolean(currentProfile.isPremium));
    }
    fetch('/api/auth/telegram/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.botUsername) setBotUsername(data.botUsername);
        setHasBotToken(Boolean(data?.hasBotToken));
      })
      .catch(() => {
        // ignore
      });
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/auth/telegram/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: telegramId,
          firstName,
          lastName,
          username,
          isPremium,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({
          type: 'error',
          text: data.error || 'Could not verify Telegram player information.',
        });
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(data.user as TelegramUserProfile);
      setStatusMsg({
        type: 'success',
        text: `Connected as ${formatTelegramDisplayName(data.user)} (${formatTelegramHandle(data.user)})!`,
      });
      setIsSubmitting(false);
      window.setTimeout(() => {
        onClose();
      }, 650);
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Network error while connecting Telegram profile.',
      });
      setIsSubmitting(false);
    }
  };

  const handleOneTapTelegramConnect = async () => {
    setStatusMsg(null);
    // 1. Check if running inside Telegram Mini App WebApp first
    const detected = detectTelegramLaunchContext();
    if (detected.profile) {
      try {
        const res = await fetch('/api/auth/telegram/webapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: detected.initDataRaw,
            unsafeUser: detected.profile,
          }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          onLoginSuccess(data.user);
          onClose();
          return;
        }
      } catch {
        onLoginSuccess(detected.profile);
        onClose();
        return;
      }
    }

    // 2. Otherwise check if TELEGRAM_BOT_TOKEN OAuth popup is configured
    try {
      const origin = encodeURIComponent(window.location.origin);
      const res = await fetch(`/api/auth/telegram/url?origin=${origin}`);
      const data = await res.json();
      if (data.configured && data.url) {
        window.open(
          data.url,
          'telegram_oauth_popup',
          'width=550,height=650,menubar=no,toolbar=no'
        );
        setStatusMsg({
          type: 'info',
          text: 'Opened Telegram OAuth window. Complete login in the popup.',
        });
        return;
      }
      // If bot token is not set yet, submit the filled Telegram information directly
      setStatusMsg({
        type: 'info',
        text: 'Signing in with your Telegram Bot player information below...',
      });
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      await handleSubmitProfile(fakeEvent);
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Could not launch Telegram OAuth popup.',
      });
    }
  };

  const handleShareOnTelegram = () => {
    const displayName = currentProfile
      ? formatTelegramDisplayName(currentProfile)
      : firstName || 'Player';
    const shareUrl = buildTelegramBotShareUrl(
      window.location.origin,
      roomCode,
      displayName,
      botUsername
    );
    const tgWin = window as unknown as TelegramWebAppWindow;
    if (tgWin.Telegram?.WebApp?.openTelegramLink) {
      tgWin.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Telegram Bot Player Login"
    >
      <div className="relative w-full max-w-[365px] rounded-2xl bg-[#0b192c] border-2 border-[#2AABEE] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white max-h-[90vh] overflow-y-auto">
        {/* Top Close Circle */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-[#2AABEE]/60 flex items-center justify-center text-sky-300 cursor-pointer"
          aria-label="Close Telegram Login"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 pb-3 pr-8 border-b border-[#2AABEE]/30">
          <div className="w-10 h-10 rounded-xl bg-[#2AABEE] flex items-center justify-center text-white shadow-lg shrink-0">
            <TelegramPaperPlaneIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold tracking-wide text-white flex items-center gap-1.5 flex-wrap">
              <span>Telegram Bot Login</span>
              <span className="px-1.5 py-0.5 rounded bg-[#2AABEE]/20 border border-[#2AABEE]/50 text-[9px] font-mono text-sky-300">
                @{botUsername}
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              Sign in with your Telegram profile to sync rooms & coins
            </p>
          </div>
        </div>

        {/* Active Telegram Profile Banner (if already logged in) */}
        {currentProfile && (
          <div className="mt-3 rounded-xl bg-slate-900/90 border border-emerald-400/60 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#2AABEE] border-2 border-white flex items-center justify-center text-xs font-black text-white shrink-0">
                {currentProfile.firstName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-extrabold text-white truncate">
                    {formatTelegramDisplayName(currentProfile)}
                  </span>
                  {currentProfile.isPremium && (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] font-mono text-sky-300 truncate">
                  {formatTelegramHandle(currentProfile)} · TG ID #{currentProfile.id}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-bold text-emerald-300 shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Linked
            </span>
          </div>
        )}

        {/* One-Tap Telegram Mini App / OAuth Button */}
        <div className="mt-3">
          <button
            type="button"
            data-testid="telegram-one-tap-btn"
            onClick={handleOneTapTelegramConnect}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#38bdf8] hover:to-[#2AABEE] text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer border border-white/30"
          >
            <TelegramPaperPlaneIcon className="w-4 h-4" />
            <span>
              {hasBotToken
                ? 'One-Tap Login with Telegram OAuth'
                : 'Auto-Detect Telegram Mini App / Quick Connect'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

        {/* Telegram Information Form */}
        <form onSubmit={handleSubmitProfile} className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Telegram Player Information
            </span>
            <span className="text-[10px] text-slate-400">
              Synced to Ludo Room
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="tg-first-name"
                className="block text-[10px] font-semibold text-slate-300 mb-1"
              >
                First Name *
              </label>
              <input
                id="tg-first-name"
                data-testid="tg-first-name-input"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Nathnael"
                className="w-full rounded-lg bg-slate-950/90 border border-[#2AABEE]/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#2AABEE]"
              />
            </div>

            <div>
              <label
                htmlFor="tg-last-name"
                className="block text-[10px] font-semibold text-slate-300 mb-1"
              >
                Last Name
              </label>
              <input
                id="tg-last-name"
                data-testid="tg-last-name-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Nasir"
                className="w-full rounded-lg bg-slate-950/90 border border-[#2AABEE]/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#2AABEE]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="tg-username"
                className="block text-[10px] font-semibold text-slate-300 mb-1"
              >
                Telegram @username
              </label>
              <input
                id="tg-username"
                data-testid="tg-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@nathnael_tg"
                className="w-full rounded-lg bg-slate-950/90 border border-[#2AABEE]/50 px-2.5 py-1.5 text-xs font-mono text-sky-200 focus:outline-none focus:border-[#2AABEE]"
              />
            </div>

            <div>
              <label
                htmlFor="tg-user-id"
                className="block text-[10px] font-semibold text-slate-300 mb-1"
              >
                Telegram User ID
              </label>
              <input
                id="tg-user-id"
                data-testid="tg-id-input"
                type="text"
                value={telegramId}
                onChange={(e) =>
                  setTelegramId(e.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="648291035"
                className="w-full rounded-lg bg-slate-950/90 border border-[#2AABEE]/50 px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-[#2AABEE]"
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 cursor-pointer">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Telegram Premium Badge</span>
            </span>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="accent-[#2AABEE] w-4 h-4 cursor-pointer"
            />
          </label>

          {statusMsg && (
            <div
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-200'
                  : statusMsg.type === 'error'
                    ? 'bg-rose-950/90 border border-rose-400 text-rose-200'
                    : 'bg-sky-950/90 border border-sky-400 text-sky-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="telegram-save-login-btn"
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {currentProfile
                ? 'Update Telegram Player Profile'
                : 'Login with Telegram Information'}
            </span>
          </button>
        </form>

        {/* Share Room to Telegram Bot Chat */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleShareOnTelegram}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-[#2AABEE]/60 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite Telegram Chat (Room {roomCode})</span>
          </button>

          {currentProfile && (
            <button
              type="button"
              onClick={() => {
                onLogoutTelegram();
                onClose();
              }}
              className="py-2 px-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-bold text-[11px] cursor-pointer"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
