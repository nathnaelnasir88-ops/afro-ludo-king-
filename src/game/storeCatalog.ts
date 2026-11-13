export type BoardThemeId =
  | 'royal_mahogany'
  | 'imperial_jade'
  | 'obsidian_cyber'
  | 'marble_olympus';

export type TokenSkinId =
  | 'classic_crown'
  | 'mecha_turret'
  | 'crystal_spire'
  | 'dragon_knight';

export interface BoardThemeConfig {
  id: BoardThemeId;
  name: string;
  subtitle: string;
  priceCoins: number;
  boardFrameColor: string;
  boardTrimColor: string;
  tileBaseColor: string;
  tileBorderColor: string;
  tableSurfaceColor: string;
  fogColor: string;
  roughness: number;
  metalness: number;
}

export interface TokenSkinConfig {
  id: TokenSkinId;
  name: string;
  subtitle: string;
  priceCoins: number;
  badgeText: string;
  accentMetalness: number;
  accentRoughness: number;
}

export interface CoinBundle {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceUSD: number;
  tag: string;
}

export const BOARD_THEMES: Record<BoardThemeId, BoardThemeConfig> = {
  royal_mahogany: {
    id: 'royal_mahogany',
    name: 'Royal Mahogany',
    subtitle: 'Hand-rubbed rosewood frame with brushed brass inlay & warm parchment tiles',
    priceCoins: 0,
    boardFrameColor: '#3e1f14',
    boardTrimColor: '#d97706',
    tileBaseColor: '#f8fafc',
    tileBorderColor: '#cbd5e1',
    tableSurfaceColor: '#0c1322',
    fogColor: '#090d16',
    roughness: 0.35,
    metalness: 0.25,
  },
  imperial_jade: {
    id: 'imperial_jade',
    name: 'Imperial Jade Palace',
    subtitle: 'Celadon nephrite stone table with gilded lotus trim & ivory tiles',
    priceCoins: 450,
    boardFrameColor: '#064e3b',
    boardTrimColor: '#fbbf24',
    tileBaseColor: '#ecfdf5',
    tileBorderColor: '#6ee7b7',
    tableSurfaceColor: '#042f2e',
    fogColor: '#022c22',
    roughness: 0.22,
    metalness: 0.35,
  },
  obsidian_cyber: {
    id: 'obsidian_cyber',
    name: 'Obsidian Forge',
    subtitle: 'Anodized dark titanium chassis with molten gold circuits & slate tiles',
    priceCoins: 750,
    boardFrameColor: '#0f172a',
    boardTrimColor: '#38bdf8',
    tileBaseColor: '#1e293b',
    tileBorderColor: '#475569',
    tableSurfaceColor: '#050811',
    fogColor: '#050811',
    roughness: 0.18,
    metalness: 0.75,
  },
  marble_olympus: {
    id: 'marble_olympus',
    name: 'Olympus Carrara',
    subtitle: 'Polished Italian white marble plinth with bronze fluted columns',
    priceCoins: 1200,
    boardFrameColor: '#e2e8f0',
    boardTrimColor: '#b45309',
    tileBaseColor: '#ffffff',
    tileBorderColor: '#94a3b8',
    tableSurfaceColor: '#1e293b',
    fogColor: '#0f172a',
    roughness: 0.15,
    metalness: 0.4,
  },
};

export const TOKEN_SKINS: Record<TokenSkinId, TokenSkinConfig> = {
  classic_crown: {
    id: 'classic_crown',
    name: 'Sovereign Crown',
    subtitle: 'Lathe-turned pedestal pawn topped with a 5-point gilded royal crown',
    priceCoins: 0,
    badgeText: 'Default Set',
    accentMetalness: 0.85,
    accentRoughness: 0.2,
  },
  mecha_turret: {
    id: 'mecha_turret',
    name: 'Vanguard Sentinel',
    subtitle: 'Armored hex chassis with twin shoulder stabilizers and glowing visor',
    priceCoins: 500,
    badgeText: '6-Part Composite',
    accentMetalness: 0.9,
    accentRoughness: 0.18,
  },
  crystal_spire: {
    id: 'crystal_spire',
    name: 'Astral Obelisk',
    subtitle: 'Faceted crystalline spire suspended inside orbit-forged brass rings',
    priceCoins: 850,
    badgeText: 'Optical Crystal',
    accentMetalness: 0.75,
    accentRoughness: 0.1,
  },
  dragon_knight: {
    id: 'dragon_knight',
    name: 'Imperial Paladin',
    subtitle: 'Shielded heavy cavalier with crested helm, cape guard, and halberd fin',
    priceCoins: 1400,
    badgeText: '8-Part Collector',
    accentMetalness: 0.92,
    accentRoughness: 0.15,
  },
};

export const COIN_BUNDLES: CoinBundle[] = [
  {
    id: 'pouch_500',
    name: 'Squire Pouch',
    coins: 500,
    bonusCoins: 0,
    priceUSD: 1.99,
    tag: 'Starter',
  },
  {
    id: 'chest_1200',
    name: 'Knight Treasury',
    coins: 1200,
    bonusCoins: 200,
    priceUSD: 4.99,
    tag: 'Popular · +200 Bonus',
  },
  {
    id: 'vault_2800',
    name: 'Royal Vault',
    coins: 2800,
    bonusCoins: 600,
    priceUSD: 9.99,
    tag: 'Best Value · +600 Bonus',
  },
  {
    id: 'sovereign_6500',
    name: 'Emperor Coffer',
    coins: 6500,
    bonusCoins: 1500,
    priceUSD: 19.99,
    tag: 'Collector · +1500 Bonus',
  },
];

export type PaymentMethod = 'card' | 'apple_google_pay' | 'upi';

export interface PaymentGatewayPayload {
  bundleId: string;
  method: PaymentMethod;
  cardHolder?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  upiId?: string;
  deviceWalletToken?: string;
}

export interface WalletState {
  coins: number;
  ownedThemes: BoardThemeId[];
  ownedSkins: TokenSkinId[];
  equippedTheme: BoardThemeId;
  equippedSkin: TokenSkinId;
  transactions: {
    id: string;
    description: string;
    amountCoins: number;
    priceUSD?: number;
    method?: string;
    timestamp: string;
  }[];
}

export function createInitialWalletState(): WalletState {
  return {
    coins: 650,
    ownedThemes: ['royal_mahogany'],
    ownedSkins: ['classic_crown'],
    equippedTheme: 'royal_mahogany',
    equippedSkin: 'classic_crown',
    transactions: [
      {
        id: 'TX-INIT-001',
        description: 'Welcome Arena Bonus',
        amountCoins: 650,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function validatePaymentInput(payload: PaymentGatewayPayload): {
  valid: boolean;
  error?: string;
} {
  const bundle = COIN_BUNDLES.find((b) => b.id === payload.bundleId);
  if (!bundle) {
    return { valid: false, error: 'Selected currency bundle was not found.' };
  }

  if (payload.method === 'card') {
    const holder = (payload.cardHolder ?? '').trim();
    const digits = (payload.cardNumber ?? '').replace(/\s+/g, '');
    const expiry = (payload.expiry ?? '').trim();
    const cvc = (payload.cvc ?? '').trim();

    if (holder.length < 3) {
      return { valid: false, error: 'Enter the cardholder full name (at least 3 characters).' };
    }
    if (!/^\d{13,19}$/.test(digits)) {
      return { valid: false, error: 'Enter a valid 16-digit card number.' };
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return { valid: false, error: 'Enter expiration date in MM/YY format.' };
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      return { valid: false, error: 'Enter a valid 3 or 4 digit security CVC.' };
    }
    return { valid: true };
  }

  if (payload.method === 'upi') {
    const upi = (payload.upiId ?? '').trim();
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upi)) {
      return { valid: false, error: 'Enter a valid UPI ID (e.g. player@okaxis).' };
    }
    return { valid: true };
  }

  if (payload.method === 'apple_google_pay') {
    return { valid: true };
  }

  return { valid: false, error: 'Unsupported payment method.' };
}

export function purchaseCatalogItem(
  wallet: WalletState,
  itemType: 'theme' | 'skin',
  itemId: BoardThemeId | TokenSkinId
): { success: boolean; wallet: WalletState; error?: string } {
  const next = structuredClone(wallet);

  if (itemType === 'theme') {
    const theme = BOARD_THEMES[itemId as BoardThemeId];
    if (!theme) return { success: false, wallet, error: 'Invalid board theme.' };
    if (next.ownedThemes.includes(theme.id)) {
      next.equippedTheme = theme.id;
      return { success: true, wallet: next };
    }
    if (next.coins < theme.priceCoins) {
      return {
        success: false,
        wallet,
        error: `Need ${theme.priceCoins - next.coins} more Royal Coins to unlock ${theme.name}.`,
      };
    }
    next.coins -= theme.priceCoins;
    next.ownedThemes.push(theme.id);
    next.equippedTheme = theme.id;
    next.transactions.unshift({
      id: `TX-THM-${Date.now().toString().slice(-5)}`,
      description: `Unlocked Theme: ${theme.name}`,
      amountCoins: -theme.priceCoins,
      timestamp: new Date().toISOString(),
    });
    return { success: true, wallet: next };
  }

  const skin = TOKEN_SKINS[itemId as TokenSkinId];
  if (!skin) return { success: false, wallet, error: 'Invalid token skin.' };
  if (next.ownedSkins.includes(skin.id)) {
    next.equippedSkin = skin.id;
    return { success: true, wallet: next };
  }
  if (next.coins < skin.priceCoins) {
    return {
      success: false,
      wallet,
      error: `Need ${skin.priceCoins - next.coins} more Royal Coins to unlock ${skin.name}.`,
    };
  }
  next.coins -= skin.priceCoins;
  next.ownedSkins.push(skin.id);
  next.equippedSkin = skin.id;
  next.transactions.unshift({
    id: `TX-SKN-${Date.now().toString().slice(-5)}`,
    description: `Unlocked Skin: ${skin.name}`,
    amountCoins: -skin.priceCoins,
    timestamp: new Date().toISOString(),
  });
  return { success: true, wallet: next };
}
