import React, { useEffect, useRef, useState } from 'react';
import {
  COLOR_CONFIG,
  MAIN_TRACK_COORDS,
  PLAYER_ORDER,
  SAFE_TRACK_INDICES,
  getGlobalTrackIndex,
  type LudoMatchState,
  type PlayerColor,
} from '../game/ludoRules';
import { BOARD_THEMES, type BoardThemeId } from '../game/storeCatalog';
import { soundFX } from '../game/soundEffects';

interface ClassicLudoBoard2DProps {
  matchState: LudoMatchState;
  themeId: BoardThemeId;
  canRoll: boolean;
  onRollDice: () => void;
  onSelectToken: (color: PlayerColor, tokenIndex: number) => void;
}

const CHECKER_PALETTE: Record<
  PlayerColor,
  {
    fill: string;
    light: string;
    dark: string;
    deepWall: string;
    rim: string;
  }
> = {
  red: {
    fill: '#e11d48',
    light: '#fb7185',
    dark: '#9f1239',
    deepWall: '#4c0519',
    rim: '#fde047',
  },
  green: {
    fill: '#16a34a',
    light: '#4ade80',
    dark: '#166534',
    deepWall: '#052e16',
    rim: '#fde047',
  },
  yellow: {
    fill: '#eab308',
    light: '#fde047',
    dark: '#a16207',
    deepWall: '#422006',
    rim: '#ffffff',
  },
  blue: {
    fill: '#0284c7',
    light: '#38bdf8',
    dark: '#075985',
    deepWall: '#082f49',
    rim: '#fde047',
  },
};

function toGrid(coord: [number, number]): [number, number] {
  return [coord[0] + 7, coord[1] + 7];
}

function getTokenGridPosition(
  color: PlayerColor,
  tokenIndex: number,
  step: number,
  allTokens: LudoMatchState['tokens']
): [number, number] {
  const yardPositions: Record<PlayerColor, [number, number][]> = {
    red: [
      [1.8, 1.8],
      [4.2, 1.8],
      [1.8, 4.2],
      [4.2, 4.2],
    ],
    green: [
      [10.8, 1.8],
      [13.2, 1.8],
      [10.8, 4.2],
      [13.2, 4.2],
    ],
    yellow: [
      [10.8, 10.8],
      [13.2, 10.8],
      [10.8, 13.2],
      [13.2, 13.2],
    ],
    blue: [
      [1.8, 10.8],
      [4.2, 10.8],
      [1.8, 13.2],
      [4.2, 13.2],
    ],
  };

  if (step === -1) {
    return yardPositions[color][tokenIndex];
  }

  if (step >= 0 && step <= 50) {
    const globalIdx = getGlobalTrackIndex(color, step)!;
    const [gx, gz] = toGrid(MAIN_TRACK_COORDS[globalIdx]);

    const colocated: { c: PlayerColor; idx: number }[] = [];
    for (const c of PLAYER_ORDER) {
      for (const t of allTokens[c]) {
        if (t.step >= 0 && t.step <= 50) {
          if (getGlobalTrackIndex(c, t.step) === globalIdx) {
            colocated.push({ c, idx: t.tokenIndex });
          }
        }
      }
    }
    if (colocated.length > 1) {
      const rank = colocated.findIndex(
        (item) => item.c === color && item.idx === tokenIndex
      );
      const angle = (rank / colocated.length) * Math.PI * 2;
      return [
        gx + 0.5 + Math.cos(angle) * 0.16,
        gz + 0.5 + Math.sin(angle) * 0.16,
      ];
    }

    return [gx + 0.5, gz + 0.5];
  }

  if (step >= 51 && step <= 55) {
    const [hx, hz] = toGrid(COLOR_CONFIG[color].homeStretchCoords[step - 51]);
    return [hx + 0.5, hz + 0.5];
  }

  // Goal (56)
  const [gx, gz] = toGrid(COLOR_CONFIG[color].goalCoord);
  const offset = (tokenIndex - 1.5) * 0.24;
  if (color === 'red') return [gx + 0.2, gz + 0.5 + offset];
  if (color === 'yellow') return [gx + 0.8, gz + 0.5 + offset];
  if (color === 'green') return [gx + 0.5 + offset, gz + 0.2];
  return [gx + 0.5 + offset, gz + 0.8];
}

const DICE_PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [26, 26],
    [74, 26],
    [50, 50],
    [26, 74],
    [74, 74],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

const CubeFacePips: React.FC<{ value: number }> = ({ value }) => {
  const pips = DICE_PIPS[value] || DICE_PIPS[6];
  const isRedPip = value === 1 || value === 6;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full block">
      <defs>
        <radialGradient id={`dice-face-grad-${value}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="16"
        fill={`url(#dice-face-grad-${value})`}
        stroke="#f59e0b"
        strokeWidth="5"
      />
      {pips.map(([px, py], idx) => (
        <g key={idx}>
          <circle
            cx={px + 1.5}
            cy={py + 2}
            r={value === 1 ? 13 : 9.5}
            fill="rgba(0,0,0,0.28)"
          />
          <circle
            cx={px}
            cy={py}
            r={value === 1 ? 13 : 9.5}
            fill={isRedPip ? '#dc2626' : '#0f172a'}
          />
          <circle
            cx={px - 3}
            cy={py - 3}
            r={value === 1 ? 3.5 : 2.5}
            fill="rgba(255,255,255,0.65)"
          />
        </g>
      ))}
    </svg>
  );
};

export const ClassicLudoBoard2D: React.FC<ClassicLudoBoard2DProps> = ({
  matchState,
  themeId,
  canRoll,
  onRollDice,
  onSelectToken,
}) => {
  const theme = BOARD_THEMES[themeId] || BOARD_THEMES.royal_mahogany;
  const [isRollingAnim, setIsRollingAnim] = useState(false);
  const [spinSeed, setSpinSeed] = useState(0);
  const [lastRolledValue, setLastRolledValue] = useState<number>(6);

  // Step-by-step visual positions for all 16 checkers
  const [visualSteps, setVisualSteps] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of PLAYER_ORDER) {
      for (let i = 0; i < 4; i++) {
        init[`${c}-${i}`] = matchState.tokens[c][i].step;
      }
    }
    return init;
  });
  const [hopActiveKey, setHopActiveKey] = useState<string | null>(null);

  // Board-level cinematic effect burst (for Unchain or Kill)
  const [boardBurst, setBoardBurst] = useState<{
    id: number;
    cx: number;
    cy: number;
    type: 'unchain' | 'kill';
    color: string;
    label: string;
  } | null>(null);

  const prevTokensRef = useRef(matchState.tokens);

  // Step-by-Step Walking & Cinematic Burst Trigger
  useEffect(() => {
    const timers: number[] = [];

    for (const c of PLAYER_ORDER) {
      for (let i = 0; i < 4; i++) {
        const key = `${c}-${i}`;
        const prevStep = prevTokensRef.current[c][i].step;
        const targetStep = matchState.tokens[c][i].step;

        if (prevStep !== targetStep) {
          if (prevStep === -1 && targetStep === 0) {
            // Unchained from yard!
            const [tx, ty] = getTokenGridPosition(c, i, 0, matchState.tokens);
            setVisualSteps((prev) => ({ ...prev, [key]: 0 }));
            setHopActiveKey(key);
            setBoardBurst({
              id: Date.now(),
              cx: tx,
              cy: ty,
              type: 'unchain',
              color: CHECKER_PALETTE[c].fill,
              label: '⛓️ UNCHAINED!',
            });
            timers.push(
              window.setTimeout(() => {
                setHopActiveKey(null);
              }, 550)
            );
          } else if (prevStep >= 0 && targetStep > prevStep) {
            // Walk every single intermediate step!
            const totalSteps = targetStep - prevStep;
            for (let s = 1; s <= totalSteps; s++) {
              const stepVal = prevStep + s;
              const tId = window.setTimeout(() => {
                soundFX.playTokenStep();
                setVisualSteps((prev) => ({ ...prev, [key]: stepVal }));
                setHopActiveKey(key);

                // If final step and it was a capture, trigger Kill Burst on landing!
                if (
                  s === totalSteps &&
                  matchState.lastMove?.player === c &&
                  matchState.lastMove?.tokenIndex === i &&
                  matchState.lastMove?.capturedToken
                ) {
                  const [kx, ky] = getTokenGridPosition(
                    c,
                    i,
                    targetStep,
                    matchState.tokens
                  );
                  soundFX.playCaptureHit();
                  setBoardBurst({
                    id: Date.now(),
                    cx: kx,
                    cy: ky,
                    type: 'kill',
                    color: '#ef4444',
                    label: '⚔️ KNOCKOUT!',
                  });
                }
              }, s * 150);
              timers.push(tId);
            }
            timers.push(
              window.setTimeout(() => {
                setHopActiveKey(null);
              }, totalSteps * 150 + 180)
            );
          } else {
            // Knocked back to yard or reset
            setVisualSteps((prev) => ({ ...prev, [key]: targetStep }));
          }
        }
      }
    }

    prevTokensRef.current = matchState.tokens;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [matchState.tokens, matchState.lastMove]);

  useEffect(() => {
    if (!boardBurst) return;
    const t = window.setTimeout(() => setBoardBurst(null), 1100);
    return () => window.clearTimeout(t);
  }, [boardBurst]);

  // Trigger dramatic 3D dice tumble in the middle whenever diceValue or turnCount changes
  useEffect(() => {
    if (matchState.diceValue !== null) {
      setLastRolledValue(matchState.diceValue);
      setIsRollingAnim(true);
      setSpinSeed((s) => s + 1);
      const timer = window.setTimeout(() => {
        setIsRollingAnim(false);
      }, 520);
      return () => window.clearTimeout(timer);
    }
  }, [matchState.diceValue, matchState.turnCount]);

  const startTrackToColor: Record<number, { color: PlayerColor; arrow: string }> = {
    0: { color: 'red', arrow: '→' },
    13: { color: 'green', arrow: '↓' },
    26: { color: 'yellow', arrow: '←' },
    39: { color: 'blue', arrow: '↑' },
  };

  const tokenRenderList: {
    key: string;
    color: PlayerColor;
    tokenIndex: number;
    step: number;
    cx: number;
    cy: number;
    isValid: boolean;
    isHopping: boolean;
  }[] = [];

  for (const color of PLAYER_ORDER) {
    const isTurn =
      matchState.currentTurn === color && matchState.turnPhase === 'WAIT_MOVE';
    for (let idx = 0; idx < 4; idx++) {
      const key = `${color}-${idx}`;
      const shownStep =
        visualSteps[key] !== undefined
          ? visualSteps[key]
          : matchState.tokens[color][idx].step;
      const [cx, cy] = getTokenGridPosition(
        color,
        idx,
        shownStep,
        matchState.tokens
      );
      const isValid = isTurn && matchState.validMoves.includes(idx);
      tokenRenderList.push({
        key,
        color,
        tokenIndex: idx,
        step: shownStep,
        cx,
        cy,
        isValid,
        isHopping: hopActiveKey === key,
      });
    }
  }
  tokenRenderList.sort((a, b) => a.cy - b.cy);

  const displayDiceVal = matchState.diceValue ?? lastRolledValue;
  const cubeRotations: Record<number, string> = {
    1: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
    6: 'rotateX(180deg) rotateY(0deg) rotateZ(0deg)',
    2: 'rotateX(-90deg) rotateY(0deg) rotateZ(0deg)',
    5: 'rotateX(90deg) rotateY(0deg) rotateZ(0deg)',
    3: 'rotateX(0deg) rotateY(-90deg) rotateZ(0deg)',
    4: 'rotateX(0deg) rotateY(90deg) rotateZ(0deg)',
  };

  const activeTurnHex = CHECKER_PALETTE[matchState.currentTurn].fill;

  return (
    <div
      className="relative w-full max-w-[368px] mx-auto rounded-2xl overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.75)] border-4 border-amber-400 bg-white select-none"
      style={{ aspectRatio: '1 / 1', minHeight: '308px' }}
    >
      <svg
        viewBox="0 0 15 15"
        width="100%"
        height="100%"
        className="w-full h-full block"
        role="img"
        aria-label="Ludo Game Board Map"
      >
        <defs>
          {PLAYER_ORDER.map((color) => {
            const pal = CHECKER_PALETTE[color];
            return (
              <React.Fragment key={`grad-${color}`}>
                <radialGradient
                  id={`checker-top-${color}`}
                  cx="35%"
                  cy="28%"
                  r="72%"
                >
                  <stop offset="0%" stopColor={pal.light} />
                  <stop offset="40%" stopColor={pal.fill} />
                  <stop offset="100%" stopColor={pal.dark} />
                </radialGradient>
                <linearGradient
                  id={`checker-wall-${color}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={pal.deepWall} />
                  <stop offset="30%" stopColor={pal.dark} />
                  <stop offset="55%" stopColor={pal.fill} />
                  <stop offset="100%" stopColor={pal.deepWall} />
                </linearGradient>
              </React.Fragment>
            );
          })}
          <radialGradient id="checker-shadow-penumbra" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(2, 6, 23, 0.65)" />
            <stop offset="55%" stopColor="rgba(2, 6, 23, 0.32)" />
            <stop offset="100%" stopColor="rgba(2, 6, 23, 0)" />
          </radialGradient>
        </defs>

        {/* Full 15x15 Map Base */}
        <rect
          x="0"
          y="0"
          width="15"
          height="15"
          fill={theme.tileBaseColor}
        />

        {/* 52 Main Track Squares */}
        {MAIN_TRACK_COORDS.map((coord, idx) => {
          const [gx, gy] = toGrid(coord);
          const startInfo = startTrackToColor[idx];
          const isStar = SAFE_TRACK_INDICES.has(idx);
          const fill = startInfo
            ? CHECKER_PALETTE[startInfo.color].fill
            : theme.tileBaseColor;

          return (
            <g key={`track-${idx}`}>
              <rect
                x={gx}
                y={gy}
                width="1"
                height="1"
                fill={fill}
                stroke="#334155"
                strokeWidth="0.045"
              />
              <rect
                x={gx + 0.05}
                y={gy + 0.05}
                width="0.9"
                height="0.9"
                fill="none"
                stroke={startInfo ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.08)'}
                strokeWidth="0.03"
              />
              {isStar && (
                <text
                  x={gx + 0.5}
                  y={gy + 0.68}
                  fontSize="0.56"
                  textAnchor="middle"
                  fill={startInfo ? '#ffffff' : '#f59e0b'}
                  style={{ pointerEvents: 'none' }}
                >
                  ★
                </text>
              )}
              {startInfo && (
                <text
                  x={gx + 0.5}
                  y={gy + 0.32}
                  fontSize="0.32"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="#ffffff"
                  style={{ pointerEvents: 'none' }}
                >
                  {startInfo.arrow}
                </text>
              )}
            </g>
          );
        })}

        {/* 4 Colored Home Stretch Lanes */}
        {PLAYER_ORDER.map((color) =>
          COLOR_CONFIG[color].homeStretchCoords.map((coord, sIdx) => {
            const [gx, gy] = toGrid(coord);
            return (
              <g key={`home-${color}-${sIdx}`}>
                <rect
                  x={gx}
                  y={gy}
                  width="1"
                  height="1"
                  fill={CHECKER_PALETTE[color].fill}
                  stroke="#334155"
                  strokeWidth="0.045"
                />
                <rect
                  x={gx + 0.08}
                  y={gy + 0.08}
                  width="0.84"
                  height="0.84"
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="0.04"
                />
              </g>
            );
          })
        )}

        {/* 4 Corner Starting Yards (6x6 each) */}
        {[
          { color: 'red' as PlayerColor, x: 0, y: 0 },
          { color: 'green' as PlayerColor, x: 9, y: 0 },
          { color: 'yellow' as PlayerColor, x: 9, y: 9 },
          { color: 'blue' as PlayerColor, x: 0, y: 9 },
        ].map(({ color, x, y }) => {
          const spots = [
            [x + 1.8, y + 1.8],
            [x + 4.2, y + 1.8],
            [x + 1.8, y + 4.2],
            [x + 4.2, y + 4.2],
          ];
          const pal = CHECKER_PALETTE[color];
          return (
            <g key={`yard-${color}`}>
              <rect
                x={x}
                y={y}
                width="6"
                height="6"
                fill={pal.fill}
                stroke="#1e293b"
                strokeWidth="0.07"
              />
              <rect
                x={x + 0.15}
                y={y + 0.15}
                width="5.7"
                height="5.7"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.06"
              />
              <rect
                x={x + 0.82}
                y={y + 0.82}
                width="4.36"
                height="4.36"
                rx="0.32"
                fill="#ffffff"
                stroke={pal.dark}
                strokeWidth="0.08"
              />
              {spots.map(([sx, sy], i) => (
                <g key={i}>
                  <circle
                    cx={sx}
                    cy={sy + 0.04}
                    r="0.60"
                    fill="rgba(0,0,0,0.18)"
                  />
                  <circle
                    cx={sx}
                    cy={sy}
                    r="0.58"
                    fill={pal.light}
                    fillOpacity="0.35"
                    stroke={pal.fill}
                    strokeWidth="0.09"
                  />
                </g>
              ))}
            </g>
          );
        })}

        {/* Center 3x3 Home Goal Triangles */}
        <g>
          <polygon
            points="6,6 7.5,7.5 6,9"
            fill={CHECKER_PALETTE.red.fill}
            stroke="#ffffff"
            strokeWidth="0.06"
          />
          <polygon
            points="6,6 9,6 7.5,7.5"
            fill={CHECKER_PALETTE.green.fill}
            stroke="#ffffff"
            strokeWidth="0.06"
          />
          <polygon
            points="9,6 9,9 7.5,7.5"
            fill={CHECKER_PALETTE.yellow.fill}
            stroke="#ffffff"
            strokeWidth="0.06"
          />
          <polygon
            points="6,9 9,9 7.5,7.5"
            fill={CHECKER_PALETTE.blue.fill}
            stroke="#ffffff"
            strokeWidth="0.06"
          />
          <circle
            cx="7.5"
            cy="7.5"
            r="1.18"
            fill="rgba(15, 23, 42, 0.82)"
            stroke={activeTurnHex}
            strokeWidth="0.11"
          />
          <circle
            cx="7.5"
            cy="7.5"
            r="1.02"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.04"
            strokeDasharray="0.16 0.10"
          />
        </g>

        {/* Render All 16 Vivid 3D Checkers with Dynamic Height-Responsive Drop Shadows */}
        {tokenRenderList.map((t) => {
          const pal = CHECKER_PALETTE[t.color];
          // Height above the board (0 when grounded, elevated when selectable or hopping)
          const heightAboveBoard = t.isHopping ? 0.38 : t.isValid ? 0.14 : 0;
          const liftY = -heightAboveBoard;
          // Dynamic 3D shadow parameters driven by heightAboveBoard
          const shadowDx = 0.03 + heightAboveBoard * 0.24;
          const shadowDy = 0.23 + heightAboveBoard * 0.18;
          const penumbraRx = 0.46 * (1 + heightAboveBoard * 0.55);
          const penumbraRy = 0.28 * (1 + heightAboveBoard * 0.55);
          const penumbraOpacity = Math.max(0.22, 0.78 - heightAboveBoard * 0.85);
          const umbraRx = Math.max(0.18, 0.36 * (1 - heightAboveBoard * 0.65));
          const umbraRy = Math.max(0.10, 0.21 * (1 - heightAboveBoard * 0.65));
          const umbraOpacity = Math.max(0.18, 0.68 - heightAboveBoard * 1.15);

          return (
            <g
              key={t.key}
              transform={`translate(${t.cx}, ${t.cy})`}
              onClick={() => {
                if (t.isValid) {
                  onSelectToken(t.color, t.tokenIndex);
                }
              }}
              style={{
                cursor: t.isValid ? 'pointer' : 'default',
                transition: 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Pulsing Legal Move Selection Halo */}
              {t.isValid && (
                <circle
                  cx="0"
                  cy="0"
                  r="0.55"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="0.11"
                  strokeDasharray="0.20 0.10"
                />
              )}

              {/* Outer Soft Penumbra Shadow (expands & shifts along light vector when elevated) */}
              <ellipse
                cx={shadowDx}
                cy={shadowDy}
                rx={penumbraRx}
                ry={penumbraRy}
                fill="url(#checker-shadow-penumbra)"
                opacity={penumbraOpacity}
              />

              {/* Inner Dark Contact Umbra Shadow (tight & dark on board, shrinks & fades with height) */}
              <ellipse
                cx={shadowDx * 0.65}
                cy={shadowDy - 0.02}
                rx={umbraRx}
                ry={umbraRy}
                fill={`rgba(2, 6, 23, ${umbraOpacity.toFixed(2)})`}
              />

              <g
                transform={`translate(0, ${liftY})`}
                style={{ transition: 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)' }}
              >
                {/* Bottom 3D Extruded Cylinder Base Wall */}
                <path
                  d="M -0.40 0.02 L -0.40 0.18 A 0.40 0.22 0 0 0 0.40 0.18 L 0.40 0.02 Z"
                  fill={`url(#checker-wall-${t.color})`}
                  stroke="#0f172a"
                  strokeWidth="0.035"
                />

                {/* Metallic Gold Mid-Wall Rib Ring */}
                <ellipse
                  cx="0"
                  cy="0.03"
                  rx="0.40"
                  ry="0.22"
                  fill="none"
                  stroke={pal.rim}
                  strokeWidth="0.05"
                />

                {/* Upper 3D Checker Cylinder Drum Wall */}
                <path
                  d="M -0.38 -0.15 L -0.38 0.02 A 0.38 0.21 0 0 0 0.38 0.02 L 0.38 -0.15 Z"
                  fill={`url(#checker-wall-${t.color})`}
                  stroke={pal.dark}
                  strokeWidth="0.03"
                />

                {/* Top 3D Beveled Checker Disc Face in Rich Team Color */}
                <ellipse
                  cx="0"
                  cy="-0.16"
                  rx="0.38"
                  ry="0.23"
                  fill={`url(#checker-top-${t.color})`}
                  stroke={pal.rim}
                  strokeWidth="0.045"
                />

                {/* Recessed Inner Checker Dish in Deep Team Shade */}
                <ellipse
                  cx="0"
                  cy="-0.16"
                  rx="0.26"
                  ry="0.155"
                  fill={pal.dark}
                  stroke={pal.rim}
                  strokeWidth="0.035"
                />

                {/* Raised 3D Center Crown Boss */}
                <ellipse
                  cx="0"
                  cy="-0.19"
                  rx="0.16"
                  ry="0.10"
                  fill={`url(#checker-top-${t.color})`}
                  stroke="#ffffff"
                  strokeWidth="0.025"
                />

                {/* Center Emblem: Lock Chain when in Yard (-1), Crown Star when Active */}
                {t.step === -1 ? (
                  <g>
                    {/* Crossed Silver Lock Chains over Locked Yard Checker */}
                    <line
                      x1="-0.28"
                      y1="-0.28"
                      x2="0.28"
                      y2="-0.02"
                      stroke="#cbd5e1"
                      strokeWidth="0.055"
                      strokeDasharray="0.08 0.04"
                    />
                    <line
                      x1="0.28"
                      y1="-0.28"
                      x2="-0.28"
                      y2="-0.02"
                      stroke="#cbd5e1"
                      strokeWidth="0.055"
                      strokeDasharray="0.08 0.04"
                    />
                    <rect
                      x="-0.09"
                      y="-0.22"
                      width="0.18"
                      height="0.15"
                      rx="0.03"
                      fill="#fbbf24"
                      stroke="#0f172a"
                      strokeWidth="0.025"
                    />
                  </g>
                ) : (
                  <text
                    x="0"
                    y="-0.14"
                    fontSize="0.20"
                    fontWeight="900"
                    textAnchor="middle"
                    fill="#ffffff"
                    style={{ pointerEvents: 'none' }}
                  >
                    ★
                  </text>
                )}

                {/* Glossy Specular Highlight Crescent */}
                <ellipse
                  cx="-0.13"
                  cy="-0.25"
                  rx="0.11"
                  ry="0.045"
                  fill="rgba(255,255,255,0.55)"
                  transform="rotate(-15 -0.13 -0.25)"
                />
              </g>
            </g>
          );
        })}

        {/* Cinematic Shockwave Ring & Floating Callout on Unchain or Kill */}
        {boardBurst && (
          <g transform={`translate(${boardBurst.cx}, ${boardBurst.cy})`}>
            <circle
              cx="0"
              cy="0"
              r="1.15"
              fill="none"
              stroke={boardBurst.color}
              strokeWidth="0.14"
              opacity="0.85"
            />
            <circle
              cx="0"
              cy="0"
              r="0.72"
              fill="none"
              stroke="#fde047"
              strokeWidth="0.09"
              strokeDasharray="0.18 0.10"
            />
            <rect
              x="-1.45"
              y="-1.25"
              width="2.9"
              height="0.58"
              rx="0.18"
              fill="#0f172a"
              stroke="#fde047"
              strokeWidth="0.05"
            />
            <text
              x="0"
              y="-0.88"
              fontSize="0.30"
              fontWeight="900"
              textAnchor="middle"
              fill="#fde047"
            >
              {boardBurst.label}
            </text>
          </g>
        )}
      </svg>

      {/* Interactive 3D Tumbling Dice Right in the Middle of the Ludo Map */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: '500px' }}
      >
        <button
          type="button"
          data-testid="center-board-dice"
          onClick={onRollDice}
          disabled={!canRoll}
          aria-label="Roll 3D Dice in Center of Board"
          className={`pointer-events-auto relative flex flex-col items-center justify-center rounded-full p-2 transition-transform ${
            canRoll
              ? 'cursor-pointer hover:scale-105 active:scale-95'
              : 'cursor-default'
          }`}
        >
          {canRoll && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-45"
              style={{ backgroundColor: activeTurnHex }}
            />
          )}

          <div
            key={spinSeed}
            className="relative w-12 h-12"
            style={{
              transformStyle: 'preserve-3d',
              transition: isRollingAnim
                ? 'transform 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                : 'transform 0.35s ease-out',
              transform: isRollingAnim
                ? 'translateY(-18px) scale(1.22) rotateX(720deg) rotateY(1080deg) rotateZ(360deg)'
                : cubeRotations[displayDiceVal] || cubeRotations[6],
            }}
          >
            <div
              className="absolute inset-0 w-12 h-12 rounded-lg shadow-lg"
              style={{ transform: 'translateZ(24px)' }}
            >
              <CubeFacePips value={1} />
            </div>
            <div
              className="absolute inset-0 w-12 h-12 rounded-lg shadow-lg"
              style={{ transform: 'rotateX(180deg) translateZ(24px)' }}
            >
              <CubeFacePips value={6} />
            </div>
            <div
              className="absolute inset-0 w-12 h-12 rounded-lg shadow-lg"
              style={{ transform: 'rotateX(90deg) translateZ(24px)' }}
            >
              <CubeFacePips value={2} />
            </div>
            <div
              className="absolute inset-0 w-12 h-12 rounded-lg shadow-lg"
              style={{ transform: 'rotateX(-90deg) translateZ(24px)' }}
            >
              <CubeFacePips value={5} />
            </div>
            <div
              className="absolute inset-0 w-12 h-12 rounded-lg shadow-lg"
              style={{ transform: 'rotateY(90deg) translateZ(24px)' }}
            >
              <CubeFacePips value={3} />
            </div>
            <div
              className="absolute inset-0 w-12 h-12 rounded-lg shadow-lg"
              style={{ transform: 'rotateY(-90deg) translateZ(24px)' }}
            >
              <CubeFacePips value={4} />
            </div>
          </div>

          <span
            className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-md border ${
              canRoll
                ? 'bg-amber-400 text-slate-950 border-white animate-bounce'
                : 'bg-slate-950/90 text-amber-300 border-amber-400/60'
            }`}
          >
            {canRoll
              ? 'TAP DICE'
              : matchState.diceValue
                ? `ROLLED ${matchState.diceValue}`
                : 'ROLL'}
          </span>
        </button>
      </div>
    </div>
  );
};
