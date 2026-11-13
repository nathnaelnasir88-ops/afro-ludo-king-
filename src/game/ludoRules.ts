export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export const PLAYER_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const COLOR_CONFIG: Record<
  PlayerColor,
  {
    label: string;
    hex: string;
    lightHex: string;
    darkHex: string;
    startTrackIndex: number;
    yardCenters: [number, number][];
    homeStretchCoords: [number, number][];
    goalCoord: [number, number];
  }
> = {
  red: {
    label: 'Crimson Guard',
    hex: '#ef4444',
    lightHex: '#fca5a5',
    darkHex: '#991b1b',
    startTrackIndex: 0,
    yardCenters: [
      [-5.2, -5.2],
      [-3.8, -5.2],
      [-5.2, -3.8],
      [-3.8, -3.8],
    ],
    homeStretchCoords: [
      [-6, 0],
      [-5, 0],
      [-4, 0],
      [-3, 0],
      [-2, 0],
    ],
    goalCoord: [-0.85, 0],
  },
  green: {
    label: 'Emerald Order',
    hex: '#10b981',
    lightHex: '#6ee7b7',
    darkHex: '#065f46',
    startTrackIndex: 13,
    yardCenters: [
      [3.8, -5.2],
      [5.2, -5.2],
      [3.8, -3.8],
      [5.2, -3.8],
    ],
    homeStretchCoords: [
      [0, -6],
      [0, -5],
      [0, -4],
      [0, -3],
      [0, -2],
    ],
    goalCoord: [0, -0.85],
  },
  yellow: {
    label: 'Solar Dynasty',
    hex: '#f59e0b',
    lightHex: '#fde68a',
    darkHex: '#92400e',
    startTrackIndex: 26,
    yardCenters: [
      [3.8, 3.8],
      [5.2, 3.8],
      [3.8, 5.2],
      [5.2, 5.2],
    ],
    homeStretchCoords: [
      [6, 0],
      [5, 0],
      [4, 0],
      [3, 0],
      [2, 0],
    ],
    goalCoord: [0.85, 0],
  },
  blue: {
    label: 'Sapphire Vanguard',
    hex: '#3b82f6',
    lightHex: '#93c5fd',
    darkHex: '#1e40af',
    startTrackIndex: 39,
    yardCenters: [
      [-5.2, 3.8],
      [-3.8, 3.8],
      [-5.2, 5.2],
      [-3.8, 5.2],
    ],
    homeStretchCoords: [
      [0, 6],
      [0, 5],
      [0, 4],
      [0, 3],
      [0, 2],
    ],
    goalCoord: [0, 0.85],
  },
};

/**
 * 52-tile clockwise perimeter track on a 15x15 Ludo board centered at (0,0) with X,Z in [-7..7].
 * Index 0 is Red's start square (-6, -1).
 */
export const MAIN_TRACK_COORDS: [number, number][] = [
  // Red bottom-left arm going right (indices 0..4)
  [-6, -1],
  [-5, -1],
  [-4, -1],
  [-3, -1],
  [-2, -1],
  // Up into top-center arm left column (indices 5..10)
  [-1, -2],
  [-1, -3],
  [-1, -4],
  [-1, -5],
  [-1, -6],
  [-1, -7],
  // Top turn (index 11)
  [0, -7],
  // Down top-center arm right column (indices 12..17) - index 13 is Green start
  [1, -7],
  [1, -6],
  [1, -5],
  [1, -4],
  [1, -3],
  [1, -2],
  // Right arm top row going right (indices 18..23)
  [2, -1],
  [3, -1],
  [4, -1],
  [5, -1],
  [6, -1],
  [7, -1],
  // Right turn (index 24)
  [7, 0],
  // Right arm bottom row going left (indices 25..30) - index 26 is Yellow start
  [7, 1],
  [6, 1],
  [5, 1],
  [4, 1],
  [3, 1],
  [2, 1],
  // Down bottom-center arm right column (indices 31..36)
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [1, 6],
  [1, 7],
  // Bottom turn (index 37)
  [0, 7],
  // Up bottom-center arm left column (indices 38..43) - index 39 is Blue start
  [-1, 7],
  [-1, 6],
  [-1, 5],
  [-1, 4],
  [-1, 3],
  [-1, 2],
  // Left arm bottom row going left (indices 44..49)
  [-2, 1],
  [-3, 1],
  [-4, 1],
  [-5, 1],
  [-6, 1],
  [-7, 1],
  // Left turn (index 50)
  [-7, 0],
  // Left arm top-left corner before Red start (index 51)
  [-7, -1],
];

/**
 * 8 Star Safe Squares on the 52-tile perimeter track:
 * - Each color's start square (0, 13, 26, 39)
 * - Each color's star square 8 steps from start (8, 21, 34, 47)
 */
export const SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

export interface TokenState {
  color: PlayerColor;
  tokenIndex: number; // 0..3
  /**
   * -1 = in starting yard
   * 0..50 = on main perimeter track (51 tiles traveled)
   * 51..55 = on colored home stretch (5 tiles)
   * 56 = inside central goal triangle (home/finished)
   */
  step: number;
}

export interface PlayerSlot {
  color: PlayerColor;
  id: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  isMicActive: boolean;
  captures: number;
  finishedCount: number;
}

export type TurnPhase = 'WAIT_ROLL' | 'WAIT_MOVE' | 'GAME_OVER';

export interface MoveRecord {
  player: PlayerColor;
  tokenIndex: number;
  fromStep: number;
  toStep: number;
  diceValue: number;
  capturedToken?: { color: PlayerColor; tokenIndex: number };
  reachedGoal: boolean;
  bonusRoll: boolean;
  timestamp: number;
}

export interface LudoMatchState {
  roomCode: string;
  mode: 'single_vs_bots' | 'pass_and_play' | 'online_room';
  players: Record<PlayerColor, PlayerSlot>;
  tokens: Record<PlayerColor, TokenState[]>;
  currentTurn: PlayerColor;
  turnPhase: TurnPhase;
  diceValue: number | null;
  consecutiveSixes: number;
  validMoves: number[];
  winner: PlayerColor | null;
  rankings: PlayerColor[];
  turnCount: number;
  lastMove: MoveRecord | null;
  actionLog: string[];
}

export function createInitialMatchState(
  roomCode = 'ROYAL1',
  mode: 'single_vs_bots' | 'pass_and_play' | 'online_room' = 'single_vs_bots',
  customNames?: Partial<Record<PlayerColor, { name: string; isBot: boolean; id?: string }>>
): LudoMatchState {
  const players = {} as Record<PlayerColor, PlayerSlot>;
  const tokens = {} as Record<PlayerColor, TokenState[]>;

  for (const color of PLAYER_ORDER) {
    const defaultBot = mode === 'single_vs_bots' ? color !== 'red' : false;
    const custom = customNames?.[color];
    players[color] = {
      color,
      id: custom?.id ?? `player-${color}`,
      name: custom?.name ?? (color === 'red' ? 'You (Crimson)' : `${COLOR_CONFIG[color].label}`),
      isBot: custom?.isBot ?? defaultBot,
      isConnected: true,
      isMicActive: false,
      captures: 0,
      finishedCount: 0,
    };

    tokens[color] = [0, 1, 2, 3].map((idx) => ({
      color,
      tokenIndex: idx,
      step: -1,
    }));
  }

  return {
    roomCode,
    mode,
    players,
    tokens,
    currentTurn: 'red',
    turnPhase: 'WAIT_ROLL',
    diceValue: null,
    consecutiveSixes: 0,
    validMoves: [],
    winner: null,
    rankings: [],
    turnCount: 1,
    lastMove: null,
    actionLog: ['Match started in Royal Ludo Arena. Crimson Guard rolls first.'],
  };
}

/**
 * Converts a player's relative step (0..50) into the global 0..51 main track index.
 * Returns null if the token is in the yard (-1), home stretch (51..55), or goal (56).
 */
export function getGlobalTrackIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  const offset = COLOR_CONFIG[color].startTrackIndex;
  return (offset + step) % 52;
}

/**
 * Returns the list of token indices (0..3) that can legally move for `color` with `diceValue`.
 */
export function getValidTokenMoves(
  state: LudoMatchState,
  color: PlayerColor,
  diceValue: number
): number[] {
  if (diceValue < 1 || diceValue > 6) return [];
  const playerTokens = state.tokens[color];
  const valid: number[] = [];

  for (const token of playerTokens) {
    if (token.step === -1) {
      if (diceValue === 6) {
        valid.push(token.tokenIndex);
      }
    } else if (token.step >= 0 && token.step < 56) {
      if (token.step + diceValue <= 56) {
        valid.push(token.tokenIndex);
      }
    }
  }
  return valid;
}

/**
 * Applies a dice roll to the match state.
 * Handles 3 consecutive sixes penalty (turn passes), or auto-pass when no legal moves exist.
 */
export function applyDiceRoll(state: LudoMatchState, diceValue: number): LudoMatchState {
  if (state.turnPhase !== 'WAIT_ROLL' || state.winner) {
    return state;
  }

  const nextState: LudoMatchState = structuredClone(state);
  const color = nextState.currentTurn;
  const playerName = nextState.players[color].name;

  nextState.diceValue = diceValue;
  nextState.consecutiveSixes = diceValue === 6 ? nextState.consecutiveSixes + 1 : 0;

  // Rule: Three consecutive sixes forfeits the turn
  if (nextState.consecutiveSixes >= 3) {
    nextState.actionLog = [
      `${playerName} rolled three 6s in a row! Turn passes.`,
      ...nextState.actionLog.slice(0, 14),
    ];
    return advanceToNextPlayer(nextState);
  }

  const validMoves = getValidTokenMoves(nextState, color, diceValue);
  nextState.validMoves = validMoves;

  if (validMoves.length === 0) {
    nextState.actionLog = [
      `${playerName} rolled ${diceValue} — no legal moves available.`,
      ...nextState.actionLog.slice(0, 14),
    ];
    return advanceToNextPlayer(nextState);
  }

  nextState.turnPhase = 'WAIT_MOVE';
  nextState.actionLog = [
    `${playerName} rolled a ${diceValue}. Select a token to move.`,
    ...nextState.actionLog.slice(0, 14),
  ];
  return nextState;
}

export function advanceToNextPlayer(state: LudoMatchState): LudoMatchState {
  const nextState = structuredClone(state);
  const currentIndex = PLAYER_ORDER.indexOf(nextState.currentTurn);

  for (let i = 1; i <= 4; i++) {
    const candidate = PLAYER_ORDER[(currentIndex + i) % 4];
    if (!nextState.rankings.includes(candidate)) {
      nextState.currentTurn = candidate;
      break;
    }
  }

  nextState.turnPhase = 'WAIT_ROLL';
  nextState.diceValue = null;
  nextState.validMoves = [];
  nextState.consecutiveSixes = 0;
  nextState.turnCount += 1;
  return nextState;
}

/**
 * Executes a legal move for `tokenIndex` of `color`.
 */
export function applyTokenMove(
  state: LudoMatchState,
  color: PlayerColor,
  tokenIndex: number,
  explicitDiceValue?: number
): LudoMatchState {
  const diceValue = explicitDiceValue ?? state.diceValue;
  if (!diceValue || state.currentTurn !== color) return state;

  const validMoves = getValidTokenMoves(state, color, diceValue);
  if (!validMoves.includes(tokenIndex)) return state;

  const nextState: LudoMatchState = structuredClone(state);
  const token = nextState.tokens[color][tokenIndex];
  const fromStep = token.step;
  const toStep = fromStep === -1 ? 0 : fromStep + diceValue;
  token.step = toStep;

  let capturedToken: { color: PlayerColor; tokenIndex: number } | undefined;

  // Check for captures on main track (0..50)
  const targetGlobalIdx = getGlobalTrackIndex(color, toStep);
  if (targetGlobalIdx !== null && !SAFE_TRACK_INDICES.has(targetGlobalIdx)) {
    for (const otherColor of PLAYER_ORDER) {
      if (otherColor === color) continue;
      const opponentOnSquare = nextState.tokens[otherColor].filter(
        (t) => getGlobalTrackIndex(otherColor, t.step) === targetGlobalIdx
      );
      // If a single opponent token is on a non-safe tile, capture it!
      if (opponentOnSquare.length === 1) {
        const victim = opponentOnSquare[0];
        victim.step = -1;
        capturedToken = { color: otherColor, tokenIndex: victim.tokenIndex };
        nextState.players[color].captures += 1;
        break;
      }
    }
  }

  const reachedGoal = toStep === 56;
  nextState.players[color].finishedCount = nextState.tokens[color].filter(
    (t) => t.step === 56
  ).length;

  // Check if player finished all 4 tokens
  const allHome = nextState.players[color].finishedCount === 4;
  if (allHome && !nextState.rankings.includes(color)) {
    nextState.rankings.push(color);
    if (!nextState.winner) {
      nextState.winner = color;
      nextState.turnPhase = 'GAME_OVER';
    }
  }

  const bonusRoll =
    !allHome && (diceValue === 6 || capturedToken !== undefined || reachedGoal);

  nextState.lastMove = {
    player: color,
    tokenIndex,
    fromStep,
    toStep,
    diceValue,
    capturedToken,
    reachedGoal,
    bonusRoll,
    timestamp: Date.now(),
  };

  const playerName = nextState.players[color].name;
  if (allHome) {
    nextState.actionLog = [
      `🏆 ${playerName} brought all 4 tokens home and won the match!`,
      ...nextState.actionLog.slice(0, 14),
    ];
    return nextState;
  }

  if (capturedToken) {
    const victimName = nextState.players[capturedToken.color].name;
    nextState.actionLog = [
      `⚔️ ${playerName} captured ${victimName}'s Token #${capturedToken.tokenIndex + 1}! Bonus roll!`,
      ...nextState.actionLog.slice(0, 14),
    ];
  } else if (reachedGoal) {
    nextState.actionLog = [
      `✨ ${playerName}'s Token #${tokenIndex + 1} reached the Royal Goal! Bonus roll!`,
      ...nextState.actionLog.slice(0, 14),
    ];
  } else if (fromStep === -1) {
    nextState.actionLog = [
      `${playerName} deployed Token #${tokenIndex + 1} onto the start square. Bonus roll!`,
      ...nextState.actionLog.slice(0, 14),
    ];
  } else {
    nextState.actionLog = [
      `${playerName} advanced Token #${tokenIndex + 1} by ${diceValue} steps.${bonusRoll ? ' Bonus roll!' : ''}`,
      ...nextState.actionLog.slice(0, 14),
    ];
  }

  if (bonusRoll) {
    nextState.turnPhase = 'WAIT_ROLL';
    nextState.diceValue = null;
    nextState.validMoves = [];
    return nextState;
  }

  return advanceToNextPlayer(nextState);
}

/**
 * Tactical heuristic for bot decision making.
 */
export function chooseSmartBotMove(
  state: LudoMatchState,
  color: PlayerColor,
  diceValue: number
): number | null {
  const validMoves = getValidTokenMoves(state, color, diceValue);
  if (validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  let bestToken = validMoves[0];
  let bestScore = -Infinity;

  for (const tokenIdx of validMoves) {
    const token = state.tokens[color][tokenIdx];
    const fromStep = token.step;
    const toStep = fromStep === -1 ? 0 : fromStep + diceValue;
    let score = 0;

    // Priority 1: Capturing an opponent token
    const targetGlobalIdx = getGlobalTrackIndex(color, toStep);
    if (targetGlobalIdx !== null && !SAFE_TRACK_INDICES.has(targetGlobalIdx)) {
      for (const otherColor of PLAYER_ORDER) {
        if (otherColor === color) continue;
        const opp = state.tokens[otherColor].filter(
          (t) => getGlobalTrackIndex(otherColor, t.step) === targetGlobalIdx
        );
        if (opp.length === 1) {
          score += 120;
        }
      }
    }

    // Priority 2: Reaching exact goal (56)
    if (toStep === 56) {
      score += 100;
    }

    // Priority 3: Deploying a token from the yard on a 6
    if (fromStep === -1 && diceValue === 6) {
      score += 85;
    }

    // Priority 4: Landing on a Star safe square
    if (targetGlobalIdx !== null && SAFE_TRACK_INDICES.has(targetGlobalIdx)) {
      score += 45;
    }

    // Priority 5: Entering safe home stretch (51..55)
    if (fromStep <= 50 && toStep >= 51) {
      score += 55;
    }

    // Tie-breaker: Advance the furthest token
    score += toStep * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestToken = tokenIdx;
    }
  }

  return bestToken;
}

/**
 * Computes exact (x, z) board coordinates for a token, including sub-tile offsets when stacked.
 */
export function getTokenBoardCoord(
  color: PlayerColor,
  tokenIndex: number,
  step: number,
  allTokens?: Record<PlayerColor, TokenState[]>
): [number, number] {
  const cfg = COLOR_CONFIG[color];

  if (step === -1) {
    return cfg.yardCenters[tokenIndex];
  }

  let baseCoord: [number, number];
  if (step >= 0 && step <= 50) {
    const globalIdx = getGlobalTrackIndex(color, step)!;
    baseCoord = MAIN_TRACK_COORDS[globalIdx];
  } else if (step >= 51 && step <= 55) {
    baseCoord = cfg.homeStretchCoords[step - 51];
  } else {
    // Goal (56)
    const goalBase = cfg.goalCoord;
    const spread = (tokenIndex - 1.5) * 0.28;
    if (color === 'red' || color === 'yellow') {
      return [goalBase[0], goalBase[1] + spread];
    }
    return [goalBase[0] + spread, goalBase[1]];
  }

  if (!allTokens) return baseCoord;

  // Check if multiple tokens occupy the same square for neat sub-tile arrangement
  const colocated: { color: PlayerColor; tokenIndex: number }[] = [];
  for (const c of PLAYER_ORDER) {
    for (const t of allTokens[c]) {
      if (t.step < 0 || t.step >= 56) continue;
      const [tx, tz] = getRawStepCoord(c, t.step);
      if (tx === baseCoord[0] && tz === baseCoord[1]) {
        colocated.push({ color: c, tokenIndex: t.tokenIndex });
      }
    }
  }

  if (colocated.length <= 1) return baseCoord;

  const idxInStack = colocated.findIndex(
    (item) => item.color === color && item.tokenIndex === tokenIndex
  );
  const angle = (idxInStack / colocated.length) * Math.PI * 2;
  const radius = 0.22;
  return [
    baseCoord[0] + Math.cos(angle) * radius,
    baseCoord[1] + Math.sin(angle) * radius,
  ];
}

function getRawStepCoord(color: PlayerColor, step: number): [number, number] {
  const cfg = COLOR_CONFIG[color];
  if (step >= 0 && step <= 50) {
    const globalIdx = getGlobalTrackIndex(color, step)!;
    return MAIN_TRACK_COORDS[globalIdx];
  }
  if (step >= 51 && step <= 55) {
    return cfg.homeStretchCoords[step - 51];
  }
  return cfg.goalCoord;
}
