import React, { useState } from 'react';
import {
  X,
  Coins,
  Palette,
  Crown,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  BOARD_THEMES,
  TOKEN_SKINS,
  COIN_BUNDLES,
  type BoardThemeId,
  type TokenSkinId,
  type WalletState,
  type PaymentMethod,
  type PaymentGatewayPayload,
} from '../game/storeCatalog';

interface StoreAndPaymentModalProps {
  isOpen: boolean;
  initialTab: 'themes' | 'skins' | 'coins';
  wallet: WalletState;
  onClose: () => void;
  onPurchaseOrEquipItem: (
    itemType: 'theme' | 'skin',
    itemId: BoardThemeId | TokenSkinId
  ) => { success: boolean; error?: string };
  onCompleteCoinPurchase: (transaction: {
    id: string;
    description: string;
    amountCoins: number;
    priceUSD: number;
    method: string;
    timestamp: string;
  }) => void;
}

export const StoreAndPaymentModal: React.FC<StoreAndPaymentModalProps> = ({
  isOpen,
  initialTab,
  wallet,
  onClose,
  onPurchaseOrEquipItem,
  onCompleteCoinPurchase,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'skins' | 'coins'>(initialTab);
  const [selectedBundleId, setSelectedBundleId] = useState<string>(COIN_BUNDLES[1].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Card / UPI form fields
  const [cardHolder, setCardHolder] = useState('Arthur Pendragon');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('08/29');
  const [cvc, setCvc] = useState('842');
  const [upiId, setUpiId] = useState('commander@okaxis');

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const selectedBundle =
    COIN_BUNDLES.find((b) => b.id === selectedBundleId) || COIN_BUNDLES[0];

  const handleThemeOrSkinClick = (
    type: 'theme' | 'skin',
    id: BoardThemeId | TokenSkinId
  ) => {
    const res = onPurchaseOrEquipItem(type, id);
    if (!res.success && res.error) {
      setFeedbackBanner({ type: 'error', text: res.error });
    } else {
      const label =
        type === 'theme'
          ? BOARD_THEMES[id as BoardThemeId].name
          : TOKEN_SKINS[id as TokenSkinId].name;
      setFeedbackBanner({
        type: 'success',
        text: `${label} is now equipped on the 3D Arena board!`,
      });
    }
  };

  const handleGatewayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackBanner(null);
    setIsProcessing(true);

    const payload: PaymentGatewayPayload = {
      bundleId: selectedBundle.id,
      method: paymentMethod,
      cardHolder,
      cardNumber,
      expiry,
      cvc,
      upiId,
    };

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setIsProcessing(false);

      if (!response.ok || !data.success) {
        setFeedbackBanner({
          type: 'error',
          text: data.error || 'Payment verification failed. Check your details.',
        });
        return;
      }

      onCompleteCoinPurchase(data.transaction);
      setFeedbackBanner({
        type: 'success',
        text: `Payment approved (${data.transaction.id})! +${data.transaction.amountCoins} Royal Coins credited.`,
      });
    } catch {
      setIsProcessing(false);
      setFeedbackBanner({
        type: 'error',
        text: 'Network error communicating with Payment Gateway.',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Royal Store, Board Themes and Payment Gateway"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-display tracking-wide">
              Royal Armory & Currency Gateway
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-amber-500/40 px-3.5 py-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Balance</span>
              <span
                data-testid="store-coin-balance"
                className="text-sm font-bold text-amber-300 font-mono tabular-nums"
              >
                {wallet.coins}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Store Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-slate-900 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('themes');
              setFeedbackBanner(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>3D Board Themes (4)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('skins');
              setFeedbackBanner(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'skins'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>3D Token Skins (4)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('coins');
              setFeedbackBanner(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'coins'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Buy Coins · Payment Gateway</span>
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackBanner && (
          <div
            className={`mx-6 mt-4 flex items-center justify-between rounded-lg px-4 py-2.5 text-xs font-semibold border ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            <span>{feedbackBanner.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'themes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(BOARD_THEMES).map((theme) => {
                const isOwned = wallet.ownedThemes.includes(theme.id);
                const isEquipped = wallet.equippedTheme === theme.id;

                return (
                  <div
                    key={theme.id}
                    className={`rounded-xl p-5 border flex flex-col justify-between gap-4 transition-colors ${
                      isEquipped
                        ? 'bg-slate-950 border-amber-400'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Theme Color Swatch Bar */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor: theme.boardFrameColor }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor: theme.boardTrimColor }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor: theme.tileBaseColor }}
                        />
                        <div className="ml-auto text-xs text-slate-300 font-mono tabular-nums font-semibold">
                          {isEquipped
                            ? 'EQUIPPED'
                            : isOwned
                            ? 'OWNED'
                            : `${theme.priceCoins} COINS`}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">{theme.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {theme.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleThemeOrSkinClick('theme', theme.id)}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-500 text-slate-950'
                          : isOwned
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {isEquipped
                        ? '✓ Equipped Board Theme'
                        : isOwned
                        ? `Equip ${theme.name}`
                        : `Unlock ${theme.name} (${theme.priceCoins} Coins)`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'skins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(TOKEN_SKINS).map((skin) => {
                const isOwned = wallet.ownedSkins.includes(skin.id);
                const isEquipped = wallet.equippedSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`rounded-xl p-5 border flex flex-col justify-between gap-4 transition-colors ${
                      isEquipped
                        ? 'bg-slate-950 border-amber-400'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{skin.badgeText}</span>
                        <span className="font-mono tabular-nums text-amber-300 font-semibold">
                          {isEquipped
                            ? 'EQUIPPED'
                            : isOwned
                            ? 'OWNED'
                            : `${skin.priceCoins} COINS`}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{skin.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {skin.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleThemeOrSkinClick('skin', skin.id)}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-500 text-slate-950'
                          : isOwned
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {isEquipped
                        ? '✓ Equipped Token Skin'
                        : isOwned
                        ? `Equip ${skin.name}`
                        : `Unlock ${skin.name} (${skin.priceCoins} Coins)`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'coins' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Currency Bundles */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-200">
                  1. Select Royal Coin Package
                </h3>
                <div className="space-y-2.5">
                  {COIN_BUNDLES.map((bundle) => {
                    const isSelected = bundle.id === selectedBundleId;
                    const total = bundle.coins + bundle.bonusCoins;
                    return (
                      <button
                        key={bundle.id}
                        type="button"
                        onClick={() => setSelectedBundleId(bundle.id)}
                        className={`w-full text-left rounded-xl p-3.5 border transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {bundle.name}
                            </span>
                            <span className="text-xs text-amber-300 font-medium">
                              · {bundle.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                            {total} Total Royal Coins
                          </p>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-sm font-bold text-emerald-300">
                            ${bundle.priceUSD.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Payment Gateway Form */}
              <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      2. Secure Payment Gateway Checkout
                    </h3>
                    <p className="text-xs text-slate-400">
                      Instant cross-platform currency credit · 256-bit TLS
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

                {/* Payment Method Switcher */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap ${
                      paymentMethod === 'card'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple_google_pay')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap ${
                      paymentMethod === 'apple_google_pay'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Apple / GPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap ${
                      paymentMethod === 'upi'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Instant UPI</span>
                  </button>
                </div>

                <form onSubmit={handleGatewayCheckout} className="space-y-3.5">
                  {paymentMethod === 'card' && (
                    <>
                      <div>
                        <label
                          htmlFor="cardholder-input"
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Cardholder Name
                        </label>
                        <input
                          id="cardholder-input"
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Full name on card"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="cardnumber-input"
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Card Number
                        </label>
                        <input
                          id="cardnumber-input"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="expiry-input"
                            className="block text-xs font-medium text-slate-300 mb-1"
                          >
                            Expiry Date (MM/YY)
                          </label>
                          <input
                            id="expiry-input"
                            type="text"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            placeholder="08/29"
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="cvc-input"
                            className="block text-xs font-medium text-slate-300 mb-1"
                          >
                            Security Code (CVC)
                          </label>
                          <input
                            id="cvc-input"
                            type="text"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            placeholder="842"
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'apple_google_pay' && (
                    <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 text-xs text-slate-300 space-y-1.5">
                      <p className="font-semibold text-white">
                        Cross-Platform Biometric Wallet Ready
                      </p>
                      <p className="text-slate-400">
                        Authorizes <strong>{selectedBundle.name}</strong> (
                        {selectedBundle.coins + selectedBundle.bonusCoins} Coins) via iOS Apple Pay or Android Google Pay token.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div>
                      <label
                        htmlFor="upi-id-input"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Virtual Payment Address (UPI ID)
                      </label>
                      <input
                        id="upi-id-input"
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="commander@okaxis"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isProcessing
                      ? 'Authorizing Payment Gateway...'
                      : `Pay $${selectedBundle.priceUSD.toFixed(2)} · Credit +${
                          selectedBundle.coins + selectedBundle.bonusCoins
                        } Royal Coins`}
                  </button>
                </form>

                {/* Recent Ledger Receipts */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-400">
                    Recent Treasury Ledger
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {wallet.transactions.slice(0, 4).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-xs text-slate-300 font-mono tabular-nums"
                      >
                        <span className="truncate max-w-[260px]">
                          {tx.id} · {tx.description}
                        </span>
                        <span
                          className={
                            tx.amountCoins >= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }
                        >
                          {tx.amountCoins >= 0 ? `+${tx.amountCoins}` : tx.amountCoins}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
