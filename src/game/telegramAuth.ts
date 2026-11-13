export interface TelegramUserProfile {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
  isPremium?: boolean;
  authMethod: 'webapp' | 'oauth' | 'bot_profile';
  authDate: number;
}

export interface TelegramWebAppWindow {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        query_id?: string;
        user?: {
          id: number;
          first_name: string;
          last_name?: string;
          username?: string;
          language_code?: string;
          is_premium?: boolean;
          photo_url?: string;
        };
        auth_date?: number;
        hash?: string;
        start_param?: string;
      };
      ready?: () => void;
      expand?: () => void;
      openTelegramLink?: (url: string) => void;
    };
  };
}

export const TELEGRAM_STORAGE_KEY = 'royal_ludo_telegram_user_v1';

export function formatTelegramDisplayName(user: TelegramUserProfile): string {
  const full = [user.firstName, user.lastName]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');
  return full || (user.username ? `@${user.username}` : `TG#${user.id}`);
}

export function formatTelegramHandle(user: TelegramUserProfile): string {
  if (user.username && user.username.trim().length > 0) {
    const clean = user.username.trim().replace(/^@+/, '');
    return `@${clean}`;
  }
  return `ID #${user.id}`;
}

export function normalizeTelegramInput(input: {
  id?: string | number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isPremium?: boolean;
  authMethod?: TelegramUserProfile['authMethod'];
}): { valid: boolean; profile?: TelegramUserProfile; error?: string } {
  const firstName = (input.firstName || '').trim();
  if (firstName.length < 2) {
    return {
      valid: false,
      error: 'Please enter your Telegram First Name (at least 2 characters).',
    };
  }

  const rawUsername = (input.username || '').trim().replace(/^@+/, '');
  if (rawUsername && !/^[a-zA-Z0-9_]{3,32}$/.test(rawUsername)) {
    return {
      valid: false,
      error:
        'Telegram @username must be 3–32 characters (letters, numbers, or underscores).',
    };
  }

  let numericId = Number(input.id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    // Deterministic positive Telegram-style 9-digit ID derived from name/username
    const seedStr = `${firstName}:${rawUsername || 'player'}`.toLowerCase();
    let hash = 5381;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash * 33) ^ seedStr.charCodeAt(i);
    }
    numericId = 100000000 + (Math.abs(hash) % 899999999);
  } else {
    numericId = Math.floor(numericId);
  }

  const lastName = (input.lastName || '').trim() || undefined;
  const photoUrl = (input.photoUrl || '').trim() || undefined;

  return {
    valid: true,
    profile: {
      id: numericId,
      firstName: firstName.slice(0, 32),
      lastName: lastName ? lastName.slice(0, 32) : undefined,
      username: rawUsername || undefined,
      photoUrl,
      isPremium: Boolean(input.isPremium),
      authMethod: input.authMethod || 'bot_profile',
      authDate: Math.floor(Date.now() / 1000),
    },
  };
}

/**
 * Extracts Telegram user and optional room start_param from either:
 * 1) Official Telegram Mini App (`window.Telegram.WebApp.initDataUnsafe`)
 * 2) URL query parameters passed by a Telegram Bot Game CallbackQuery (`?tg_id=...&tg_first_name=...&tg_username=...&room=...`)
 */
export function detectTelegramLaunchContext(
  win: TelegramWebAppWindow & Window = window as unknown as TelegramWebAppWindow & Window
): {
  profile: TelegramUserProfile | null;
  initDataRaw: string | null;
  startRoomCode: string | null;
} {
  let profile: TelegramUserProfile | null = null;
  let initDataRaw: string | null = null;
  let startRoomCode: string | null = null;

  try {
    const tgWebApp = win.Telegram?.WebApp;
    if (tgWebApp) {
      tgWebApp.ready?.();
      tgWebApp.expand?.();
      if (tgWebApp.initData) {
        initDataRaw = tgWebApp.initData;
      }
      const unsafe = tgWebApp.initDataUnsafe;
      if (unsafe?.user && unsafe.user.id && unsafe.user.first_name) {
        profile = {
          id: Number(unsafe.user.id),
          firstName: String(unsafe.user.first_name),
          lastName: unsafe.user.last_name ? String(unsafe.user.last_name) : undefined,
          username: unsafe.user.username ? String(unsafe.user.username) : undefined,
          photoUrl: unsafe.user.photo_url ? String(unsafe.user.photo_url) : undefined,
          languageCode: unsafe.user.language_code,
          isPremium: Boolean(unsafe.user.is_premium),
          authMethod: 'webapp',
          authDate: Number(unsafe.auth_date || Math.floor(Date.now() / 1000)),
        };
      }
      if (unsafe?.start_param) {
        const cleaned = unsafe.start_param.replace(/^room_/i, '').toUpperCase();
        if (/^[A-Z0-9]{4,8}$/.test(cleaned)) {
          startRoomCode = cleaned;
        }
      }
    }

    const params = new URLSearchParams(win.location.search);
    const roomParam =
      params.get('room') ||
      params.get('tgWebAppStartParam') ||
      params.get('startapp');
    if (roomParam && !startRoomCode) {
      const cleaned = roomParam.replace(/^room_/i, '').toUpperCase();
      if (/^[A-Z0-9]{4,8}$/.test(cleaned)) {
        startRoomCode = cleaned;
      }
    }

    if (!profile) {
      const qFirstName = params.get('tg_first_name') || params.get('first_name');
      const qId = params.get('tg_id') || params.get('id');
      const qUsername = params.get('tg_username') || params.get('username');
      const qLastName = params.get('tg_last_name') || params.get('last_name');
      const qPhoto = params.get('tg_photo_url') || params.get('photo_url');

      if (qFirstName || qUsername) {
        const norm = normalizeTelegramInput({
          id: qId || undefined,
          firstName: qFirstName || qUsername || 'Telegram Player',
          lastName: qLastName || undefined,
          username: qUsername || undefined,
          photoUrl: qPhoto || undefined,
          authMethod: 'webapp',
        });
        if (norm.valid && norm.profile) {
          profile = norm.profile;
        }
      }
    }
  } catch {
    // ignore environment access errors
  }

  return { profile, initDataRaw, startRoomCode };
}

export function buildTelegramBotShareUrl(
  appOrigin: string,
  roomCode: string,
  playerName: string,
  botUsername = 'RoyalLudo3DBot'
): string {
  const cleanBot = botUsername.replace(/^@+/, '').trim();
  const gameUrl = `${appOrigin}/?room=${encodeURIComponent(roomCode)}`;
  const inviteText = `🎲 Join ${playerName}'s 3D Ludo Room (${roomCode}) on @${cleanBot}!`;
  return `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(inviteText)}`;
}
