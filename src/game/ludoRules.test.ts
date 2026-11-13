import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialMatchState,
  getValidTokenMoves,
  applyDiceRoll,
  applyTokenMove,
  chooseSmartBotMove,
  getGlobalTrackIndex,
} from './ludoRules';
import {
  createInitialWalletState,
  validatePaymentInput,
  purchaseCatalogItem,
} from './storeCatalog';
import {
  normalizeTelegramInput,
  formatTelegramDisplayName,
  formatTelegramHandle,
  buildTelegramBotShareUrl,
} from './telegramAuth';

test('tokens in yard (-1) can only be unlocked on a dice roll of 6', () => {
  const state = createInitialMatchState('TEST01', 'pass_and_play');
  assert.deepEqual(getValidTokenMoves(state, 'red', 4), []);
  assert.deepEqual(getValidTokenMoves(state, 'red', 6), [0, 1, 2, 3]);
});

test('rolling a 6 unlocks a token to step 0 and grants a bonus roll', () => {
  let state = createInitialMatchState('TEST01', 'pass_and_play');
  state = applyDiceRoll(state, 6);
  assert.equal(state.turnPhase, 'WAIT_MOVE');
  state = applyTokenMove(state, 'red', 0);
  assert.equal(state.tokens.red[0].step, 0);
  assert.equal(state.currentTurn, 'red');
  assert.equal(state.turnPhase, 'WAIT_ROLL');
});

test('capturing an opponent token on a non-safe square sends victim to yard and grants bonus roll', () => {
  let state = createInitialMatchState('TEST02', 'pass_and_play');
  state.tokens.red[0].step = 11;
  state.tokens.green[0].step = 2;
  assert.equal(getGlobalTrackIndex('red', 15), 15);
  assert.equal(getGlobalTrackIndex('green', 2), 15);

  state = applyDiceRoll(state, 4);
  state = applyTokenMove(state, 'red', 0);

  assert.equal(state.tokens.red[0].step, 15);
  assert.equal(state.tokens.green[0].step, -1); // sent back to yard
  assert.equal(state.players.red.captures, 1);
  assert.equal(state.currentTurn, 'red'); // bonus roll for capture
});

test('safe star squares protect tokens from capture', () => {
  let state = createInitialMatchState('TEST03', 'pass_and_play');
  state.tokens.red[0].step = 8; // global 8
  state.tokens.blue[0].step = 18; // global 5
  state.currentTurn = 'blue';

  state = applyDiceRoll(state, 3);
  state = applyTokenMove(state, 'blue', 0);

  assert.equal(state.tokens.blue[0].step, 21);
  assert.equal(state.tokens.red[0].step, 8); // NOT captured because index 8 is safe
});

test('all 4 tokens reaching step 56 triggers victory state', () => {
  let state = createInitialMatchState('TEST04', 'pass_and_play');
  state.tokens.red[0].step = 56;
  state.tokens.red[1].step = 56;
  state.tokens.red[2].step = 56;
  state.tokens.red[3].step = 54;

  state = applyDiceRoll(state, 2);
  state = applyTokenMove(state, 'red', 3);

  assert.equal(state.tokens.red[3].step, 56);
  assert.equal(state.winner, 'red');
  assert.equal(state.turnPhase, 'GAME_OVER');
});

test('bot heuristic prioritizes capturing an opponent token', () => {
  const state = createInitialMatchState('TEST05', 'single_vs_bots');
  state.currentTurn = 'green';
  state.tokens.green[0].step = 0;
  state.tokens.green[1].step = 5;
  state.tokens.red[0].step = 22;

  const chosen = chooseSmartBotMove(state, 'green', 4);
  assert.equal(chosen, 1);
});

test('payment gateway validation & store unlocking work end-to-end', () => {
  const badCard = validatePaymentInput({
    bundleId: 'chest_1200',
    method: 'card',
    cardHolder: 'Al',
    cardNumber: '123',
    expiry: '13/99',
    cvc: '1',
  });
  assert.equal(badCard.valid, false);

  const validCard = validatePaymentInput({
    bundleId: 'chest_1200',
    method: 'card',
    cardHolder: 'Arthur Pendragon',
    cardNumber: '4242 4242 4242 4242',
    expiry: '08/29',
    cvc: '842',
  });
  assert.equal(validCard.valid, true);

  const wallet = createInitialWalletState(); // starts with 650 coins
  const res = purchaseCatalogItem(wallet, 'theme', 'imperial_jade'); // costs 450 coins
  assert.equal(res.success, true);
  assert.equal(res.wallet.coins, 200);
  assert.equal(res.wallet.equippedTheme, 'imperial_jade');
});

test('telegram player login normalization and bot share link generation work accurately', () => {
  const invalidName = normalizeTelegramInput({
    firstName: 'A',
    username: 'valid_user',
  });
  assert.equal(invalidName.valid, false);

  const invalidHandle = normalizeTelegramInput({
    firstName: 'Nathnael',
    username: '@bad!handle',
  });
  assert.equal(invalidHandle.valid, false);

  const validUser = normalizeTelegramInput({
    id: '582910421',
    firstName: 'Nathnael',
    lastName: 'Nasir',
    username: '@nathnael_tg',
    isPremium: true,
    authMethod: 'bot_profile',
  });
  assert.equal(validUser.valid, true);
  assert.equal(validUser.profile?.id, 582910421);
  assert.equal(validUser.profile?.username, 'nathnael_tg');
  assert.equal(formatTelegramDisplayName(validUser.profile!), 'Nathnael Nasir');
  assert.equal(formatTelegramHandle(validUser.profile!), '@nathnael_tg');

  const shareUrl = buildTelegramBotShareUrl(
    'https://example.run.app',
    'ROYAL7',
    'Nathnael Nasir',
    'RoyalLudo3DBot'
  );
  assert.ok(shareUrl.startsWith('https://t.me/share/url?'));
  assert.ok(shareUrl.includes('ROYAL7'));
});

