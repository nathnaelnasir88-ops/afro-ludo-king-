import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  COLOR_CONFIG,
  MAIN_TRACK_COORDS,
  PLAYER_ORDER,
  SAFE_TRACK_INDICES,
  getTokenBoardCoord,
  type LudoMatchState,
  type PlayerColor,
} from '../game/ludoRules';
import {
  BOARD_THEMES,
  TOKEN_SKINS,
  type BoardThemeId,
  type TokenSkinId,
} from '../game/storeCatalog';
import { soundFX } from '../game/soundEffects';

export type CameraPreset = 'isometric' | 'top' | 'orbital';

interface LudoBoard3DProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  matchState: LudoMatchState;
  themeId: BoardThemeId;
  skinId: TokenSkinId;
  cameraPreset: CameraPreset;
  onSelectToken: (color: PlayerColor, tokenIndex: number) => void;
  onRollDiceClick: () => void;
}

// Pre-allocated module-scope scratch math objects (Zero GC in render loop)
const _dummyMat = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyColor = new THREE.Color();
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

const PARTICLE_POOL_SIZE = 72;

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  colorHex: string;
}

// Deep, rich, high-saturation colors for both the 3D Map and 3D Checkers
const VIVID_PALETTE: Record<
  PlayerColor,
  {
    main: string;
    dark: string;
    deepWall: string;
    rim: string;
    mainHex: number;
    darkHex: number;
    rimHex: number;
  }
> = {
  red: {
    main: '#e11d48',
    dark: '#9f1239',
    deepWall: '#881337',
    rim: '#fda4af',
    mainHex: 0xe11d48,
    darkHex: 0x881337,
    rimHex: 0xfda4af,
  },
  green: {
    main: '#16a34a',
    dark: '#166534',
    deepWall: '#14532d',
    rim: '#86efac',
    mainHex: 0x16a34a,
    darkHex: 0x14532d,
    rimHex: 0x86efac,
  },
  yellow: {
    main: '#eab308',
    dark: '#a16207',
    deepWall: '#713f12',
    rim: '#fef08a',
    mainHex: 0xeab308,
    darkHex: 0x713f12,
    rimHex: 0xfef08a,
  },
  blue: {
    main: '#0284c7',
    dark: '#075985',
    deepWall: '#0c4a6e',
    rim: '#7dd3fc',
    mainHex: 0x0284c7,
    darkHex: 0x0c4a6e,
    rimHex: 0x7dd3fc,
  },
};

/**
 * Generates a high-contrast, deeply saturated 1024x1024 Ludo Map texture.
 */
function createFullLudoMapTexture(
  tileBaseHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cell = size / 15;

  ctx.fillStyle = tileBaseHex || '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  const startTrackToColor: Record<number, { color: PlayerColor; arrow: string }> = {
    0: { color: 'red', arrow: '→' },
    13: { color: 'green', arrow: '↓' },
    26: { color: 'yellow', arrow: '←' },
    39: { color: 'blue', arrow: '↑' },
  };

  // Draw 52 main track squares
  MAIN_TRACK_COORDS.forEach(([bx, bz], idx) => {
    const gx = bx + 7;
    const gy = bz + 7;
    const x = gx * cell;
    const y = gy * cell;
    const startInfo = startTrackToColor[idx];

    ctx.fillStyle = startInfo
      ? VIVID_PALETTE[startInfo.color].main
      : tileBaseHex || '#f8fafc';
    ctx.fillRect(x, y, cell, cell);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(x, y, cell, cell);

    if (SAFE_TRACK_INDICES.has(idx)) {
      ctx.save();
      ctx.translate(x + cell / 2, y + cell / 2);
      ctx.fillStyle = startInfo ? '#ffffff' : '#d97706';
      ctx.beginPath();
      const spikes = 5;
      const outerR = cell * 0.34;
      const innerR = cell * 0.15;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const sx = Math.cos(angle) * r;
        const sy = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });

  // Draw 4 Colored Home Stretch Lanes
  for (const color of PLAYER_ORDER) {
    for (const [hx, hz] of COLOR_CONFIG[color].homeStretchCoords) {
      const gx = hx + 7;
      const gy = hz + 7;
      const x = gx * cell;
      const y = gy * cell;
      ctx.fillStyle = VIVID_PALETTE[color].main;
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, cell, cell);
    }
  }

  // Draw 4 Corner 6x6 Starting Yards
  const yards: { color: PlayerColor; gx: number; gy: number }[] = [
    { color: 'red', gx: 0, gy: 0 },
    { color: 'green', gx: 9, gy: 0 },
    { color: 'yellow', gx: 9, gy: 9 },
    { color: 'blue', gx: 0, gy: 9 },
  ];

  for (const { color, gx, gy } of yards) {
    const x = gx * cell;
    const y = gy * cell;
    const w = 6 * cell;

    ctx.fillStyle = VIVID_PALETTE[color].main;
    ctx.fillRect(x, y, w, w);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(x, y, w, w);

    // Crisp White Inner Courtyard
    const pad = 0.85 * cell;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, w - pad * 2, w - pad * 2, 20);
    ctx.fill();
    ctx.strokeStyle = VIVID_PALETTE[color].dark;
    ctx.lineWidth = 5;
    ctx.stroke();

    // 4 Colored Spawn Circles inside Yard
    const spots = [
      [gx + 1.8, gy + 1.8],
      [gx + 4.2, gy + 1.8],
      [gx + 1.8, gy + 4.2],
      [gx + 4.2, gy + 4.2],
    ];
    for (const [sx, sy] of spots) {
      ctx.beginPath();
      ctx.arc(sx * cell, sy * cell, cell * 0.56, 0, Math.PI * 2);
      ctx.fillStyle = VIVID_PALETTE[color].rim;
      ctx.fill();
      ctx.strokeStyle = VIVID_PALETTE[color].main;
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }

  // Draw Center 3x3 Home Goal with 4 Vivid Colored Triangles
  const cLeft = 6 * cell;
  const cTop = 6 * cell;
  const cRight = 9 * cell;
  const cBottom = 9 * cell;
  const cMidX = 7.5 * cell;
  const cMidY = 7.5 * cell;

  const drawTriangle = (
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    fill: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.stroke();
  };

  drawTriangle([cLeft, cTop], [cMidX, cMidY], [cLeft, cBottom], VIVID_PALETTE.red.main);
  drawTriangle([cLeft, cTop], [cRight, cTop], [cMidX, cMidY], VIVID_PALETTE.green.main);
  drawTriangle([cRight, cTop], [cRight, cBottom], [cMidX, cMidY], VIVID_PALETTE.yellow.main);
  drawTriangle([cLeft, cBottom], [cRight, cBottom], [cMidX, cMidY], VIVID_PALETTE.blue.main);

  // Center circular dice arena pad
  ctx.beginPath();
  ctx.arc(cMidX, cMidY, cell * 0.88, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createDiceFaceTexture(
  pipCount: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(100, 90, 16, 128, 128, 170);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.75, '#f8fafc');
  grad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 236, 236);

  const pipPositions: Record<number, [number, number][]> = {
    1: [[128, 128]],
    2: [
      [70, 70],
      [186, 186],
    ],
    3: [
      [66, 66],
      [128, 128],
      [190, 190],
    ],
    4: [
      [70, 70],
      [186, 70],
      [70, 186],
      [186, 186],
    ],
    5: [
      [66, 66],
      [190, 66],
      [128, 128],
      [66, 190],
      [190, 190],
    ],
    6: [
      [70, 60],
      [186, 60],
      [70, 128],
      [186, 128],
      [70, 196],
      [186, 196],
    ],
  };

  for (const [px, py] of pipPositions[pipCount] || []) {
    ctx.beginPath();
    ctx.arc(px + 2, py + 3, pipCount === 1 ? 32 : 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, pipCount === 1 ? 31 : 21, 0, Math.PI * 2);
    ctx.fillStyle = pipCount === 1 || pipCount === 6 ? '#dc2626' : '#0f172a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px - 6, py - 6, pipCount === 1 ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Builds a deeply saturated 3D-sculpted Ludo Checker with a 3D Lock Chain
 * around it when locked in the starting yard (step === -1).
 */
function buildSculpted3DCheckerGroup(
  color: PlayerColor,
  skinId: TokenSkinId,
  contactShadowTex: THREE.Texture
): {
  group: THREE.Group;
  shadowGroup: THREE.Group;
  umbraMat: THREE.MeshBasicMaterial;
  penumbraMat: THREE.MeshBasicMaterial;
  umbraMesh: THREE.Mesh;
  penumbraMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  chainGroup: THREE.Group;
} {
  const pal = VIVID_PALETTE[color];
  const skinCfg = TOKEN_SKINS[skinId];
  const group = new THREE.Group();
  const shadowGroup = new THREE.Group();

  // 1a. Outer Soft Penumbra Drop Shadow (expands & shifts along light vector as checker rises in height)
  const penumbraGeo = new THREE.CircleGeometry(0.64, 32);
  const penumbraMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const penumbraMesh = new THREE.Mesh(penumbraGeo, penumbraMat);
  penumbraMesh.rotation.x = -Math.PI / 2;
  penumbraMesh.position.y = 0.045;
  penumbraMesh.renderOrder = 2;
  shadowGroup.add(penumbraMesh);

  // 1b. Inner Crisp Umbra Contact Shadow Core (tightens & darkens when checker touches board)
  const umbraGeo = new THREE.CircleGeometry(0.46, 28);
  const umbraMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
  });
  const umbraMesh = new THREE.Mesh(umbraGeo, umbraMat);
  umbraMesh.rotation.x = -Math.PI / 2;
  umbraMesh.position.y = 0.05;
  umbraMesh.renderOrder = 3;
  shadowGroup.add(umbraMesh);

  // 2. Pulsing Selection Halo Ring (pinned to board surface inside shadowGroup)
  const ringGeo = new THREE.RingGeometry(0.44, 0.56, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.055;
  ringMesh.renderOrder = 4;
  ringMesh.visible = false;
  shadowGroup.add(ringMesh);

  // Deeply saturated, high-visibility 3D Checker Materials (low envMapIntensity prevents white glare)
  const darkWallMat = new THREE.MeshStandardMaterial({
    color: pal.darkHex,
    roughness: 0.48,
    metalness: 0.15,
    envMapIntensity: 0.25,
  });
  const primaryCheckerMat = new THREE.MeshStandardMaterial({
    color: pal.mainHex,
    roughness: 0.32,
    metalness: 0.12,
    envMapIntensity: 0.3,
  });
  const brightRimMat = new THREE.MeshStandardMaterial({
    color: pal.mainHex,
    roughness: 0.22,
    metalness: 0.25,
    envMapIntensity: 0.35,
  });
  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: skinCfg.accentRoughness,
    metalness: skinCfg.accentMetalness,
    envMapIntensity: 0.5,
  });
  const whiteCrestMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.2,
    envMapIntensity: 0.3,
  });

  // Layer 1: Thick dark bottom foundation cylinder (gives strong 3D checker height)
  const lowerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.40, 0.18, 32),
    darkWallMat
  );
  lowerDisc.position.y = 0.09;
  lowerDisc.castShadow = true;
  lowerDisc.receiveShadow = true;
  group.add(lowerDisc);

  // Layer 2: Gold middle band around the checker wall
  const midGoldBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.375, 0.035, 14, 32),
    goldAccentMat
  );
  midGoldBand.rotation.x = Math.PI / 2;
  midGoldBand.position.y = 0.18;
  group.add(midGoldBand);

  // Layer 3: Upper main colored 3D checker cylinder drum
  const upperDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.37, 0.22, 32),
    primaryCheckerMat
  );
  upperDrum.position.y = 0.29;
  upperDrum.castShadow = true;
  upperDrum.receiveShadow = true;
  group.add(upperDrum);

  // Layer 4: Thick beveled outer top rim in rich team color
  const topOuterRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.052, 18, 32),
    brightRimMat
  );
  topOuterRim.rotation.x = Math.PI / 2;
  topOuterRim.position.y = 0.40;
  topOuterRim.castShadow = true;
  group.add(topOuterRim);

  // Layer 5: Recessed dark inner well
  const innerWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.04, 28),
    darkWallMat
  );
  innerWell.position.y = 0.395;
  group.add(innerWell);

  // Layer 6: Inner concentric gold ring
  const innerGoldRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.20, 0.03, 14, 28),
    goldAccentMat
  );
  innerGoldRing.rotation.x = Math.PI / 2;
  innerGoldRing.position.y = 0.42;
  group.add(innerGoldRing);

  // Layer 7: Raised 3D Crown / Pedestal Center Boss in bold team color
  if (skinId === 'classic_crown') {
    const centerBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.16, 16),
      primaryCheckerMat
    );
    centerBoss.position.y = 0.47;
    centerBoss.castShadow = true;
    group.add(centerBoss);

    const crownJewel = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 18, 18),
      whiteCrestMat
    );
    crownJewel.position.y = 0.57;
    group.add(crownJewel);
  } else if (skinId === 'mecha_turret') {
    const hexBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.19, 0.18, 6),
      primaryCheckerMat
    );
    hexBoss.position.y = 0.48;
    group.add(hexBoss);

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.08, 16),
      goldAccentMat
    );
    core.position.y = 0.58;
    group.add(core);
  } else if (skinId === 'crystal_spire') {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.17, 0),
      primaryCheckerMat
    );
    crystal.scale.set(1, 1.4, 1);
    crystal.position.y = 0.54;
    group.add(crystal);
  } else {
    const shieldBoss = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.24, 8),
      primaryCheckerMat
    );
    shieldBoss.position.y = 0.52;
    group.add(shieldBoss);
  }

  // Layer 8: 3D Prison Lock Chain Group (visible while locked in Yard step === -1)
  const chainGroup = new THREE.Group();
  const chainMetalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.35,
    metalness: 0.75,
  });
  const padlockMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.25,
    metalness: 0.8,
  });

  const chainLoop1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.032, 10, 24),
    chainMetalMat
  );
  chainLoop1.position.y = 0.28;
  chainLoop1.rotation.x = Math.PI / 2 + 0.28;
  chainLoop1.rotation.y = 0.25;
  chainGroup.add(chainLoop1);

  const chainLoop2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.032, 10, 24),
    chainMetalMat
  );
  chainLoop2.position.y = 0.28;
  chainLoop2.rotation.x = Math.PI / 2 - 0.28;
  chainLoop2.rotation.y = -0.25;
  chainGroup.add(chainLoop2);

  // Front Golden Padlock on the Chain
  const lockBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.09),
    padlockMat
  );
  lockBody.position.set(0, 0.24, 0.42);
  chainGroup.add(lockBody);

  group.add(chainGroup);

  return {
    group,
    shadowGroup,
    umbraMat,
    penumbraMat,
    umbraMesh,
    penumbraMesh,
    ringMesh,
    chainGroup,
  };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 63);
  g.addColorStop(0, 'rgba(2, 6, 23, 0.98)');
  g.addColorStop(0.58, 'rgba(2, 6, 23, 0.78)');
  g.addColorStop(0.84, 'rgba(2, 6, 23, 0.34)');
  g.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export const LudoBoard3D: React.FC<LudoBoard3DProps> = ({
  gameState,
  matchState,
  themeId,
  skinId,
  cameraPreset,
  onSelectToken,
  onRollDiceClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    gameState,
    matchState,
    themeId,
    skinId,
    cameraPreset,
    onSelectToken,
    onRollDiceClick,
  });
  useEffect(() => {
    stateRef.current = {
      gameState,
      matchState,
      themeId,
      skinId,
      cameraPreset,
      onSelectToken,
      onRollDiceClick,
    };
  }, [
    gameState,
    matchState,
    themeId,
    skinId,
    cameraPreset,
    onSelectToken,
    onRollDiceClick,
  ]);

  const sceneRebuildRef = useRef<{
    applyTheme: (t: BoardThemeId) => void;
    rebuildTokens: (s: TokenSkinId) => void;
    triggerDiceAnimation: (val: number) => void;
    spawnBurst: (x: number, y: number, z: number, hex: string, count: number) => void;
    triggerShockwave: (x: number, z: number, colorHex: number, maxRadius: number) => void;
    triggerCinematicCamera: (
      focusX: number,
      focusZ: number,
      duration: number,
      shakeIntensity: number
    ) => void;
  } | null>(null);

  useEffect(() => {
    sceneRebuildRef.current?.applyTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    sceneRebuildRef.current?.rebuildTokens(skinId);
  }, [skinId]);

  // Trigger 3D center dice spin whenever diceValue or turnCount updates
  const prevDiceKeyRef = useRef<string>('');
  useEffect(() => {
    const key = `${matchState.turnCount}-${matchState.diceValue}`;
    if (matchState.diceValue !== null && key !== prevDiceKeyRef.current) {
      sceneRebuildRef.current?.triggerDiceAnimation(matchState.diceValue);
      sceneRebuildRef.current?.spawnBurst(
        0,
        1.1,
        0,
        COLOR_CONFIG[matchState.currentTurn].hex,
        14
      );
    }
    prevDiceKeyRef.current = key;
  }, [matchState.diceValue, matchState.turnCount, matchState.currentTurn]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // NoToneMapping preserves 100% rich, vivid Red/Green/Yellow/Blue colors without bleaching
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = Math.max(container.clientWidth, 320);
    const initH = Math.max(container.clientHeight, 320);
    renderer.setSize(initW, initH);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialTheme = BOARD_THEMES[stateRef.current.themeId] || BOARD_THEMES.royal_mahogany;
    scene.background = new THREE.Color('#03112e');

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.1, 120);
    camera.position.set(0, 17.8, 6.6);
    camera.lookAt(0, -0.2, 0.35);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 8;
    controls.maxDistance = 26;
    controls.target.set(0, -0.2, 0.35);

    // Balanced lighting so 3D checkers have rich unclipped colors (0.55 + 0.60 <= 1.15)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 0.62);
    keyLight.position.set(-7, 18, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 40;
    const d = 9.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.25);
    rimLight.position.set(10, 11, -9);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const contactShadowTex = createContactShadowTexture();

    // Build 3D Ludo Board with Exact 1:1 Saturated Map Surface + 3D Raised Colored Yard Walls
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const frameMat = new THREE.MeshStandardMaterial({
      color: initialTheme.boardFrameColor,
      roughness: 0.45,
      metalness: 0.25,
    });
    const outerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(16.0, 0.65, 16.0),
      frameMat
    );
    outerFrame.position.y = -0.34;
    outerFrame.receiveShadow = true;
    boardGroup.add(outerFrame);

    const trimMat = new THREE.MeshStandardMaterial({
      color: initialTheme.boardTrimColor,
      roughness: 0.3,
      metalness: 0.65,
    });
    const goldRimBed = new THREE.Mesh(
      new THREE.BoxGeometry(15.35, 0.68, 15.35),
      trimMat
    );
    goldRimBed.position.y = -0.33;
    boardGroup.add(goldRimBed);

    // Unclipped 1:1 sRGB Map Material so the 3D Ludo Map colors are 100% vivid and never over-exposed
    let mapTex = createFullLudoMapTexture(initialTheme.tileBaseColor, maxAniso);
    const mapSurfaceMat = new THREE.MeshBasicMaterial({
      map: mapTex,
    });
    const mapSurfaceMesh = new THREE.Mesh(
      new THREE.BoxGeometry(15.0, 0.16, 15.0),
      mapSurfaceMat
    );
    mapSurfaceMesh.position.y = 0.0;
    mapSurfaceMesh.receiveShadow = true;
    boardGroup.add(mapSurfaceMesh);

    // 3D Raised Colored Yard Frames & Spawn Socket Rings for vivid 3D color presence
    const colorMats: Record<PlayerColor, THREE.MeshStandardMaterial> = {
      red: new THREE.MeshStandardMaterial({
        color: VIVID_PALETTE.red.mainHex,
        roughness: 0.35,
        metalness: 0.1,
        envMapIntensity: 0.2,
      }),
      green: new THREE.MeshStandardMaterial({
        color: VIVID_PALETTE.green.mainHex,
        roughness: 0.35,
        metalness: 0.1,
        envMapIntensity: 0.2,
      }),
      yellow: new THREE.MeshStandardMaterial({
        color: VIVID_PALETTE.yellow.mainHex,
        roughness: 0.35,
        metalness: 0.1,
        envMapIntensity: 0.2,
      }),
      blue: new THREE.MeshStandardMaterial({
        color: VIVID_PALETTE.blue.mainHex,
        roughness: 0.35,
        metalness: 0.1,
        envMapIntensity: 0.2,
      }),
    };

    const yardCornerCenters: Record<PlayerColor, [number, number]> = {
      red: [-4.5, -4.5],
      green: [4.5, -4.5],
      yellow: [4.5, 4.5],
      blue: [-4.5, 4.5],
    };

    for (const color of PLAYER_ORDER) {
      const [ycx, ycz] = yardCornerCenters[color];
      // 3D Raised Outer Colored Rim Walls around each 6x6 Yard
      const wallN = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.18, 0.38), colorMats[color]);
      wallN.position.set(ycx, 0.10, ycz - 2.76);
      boardGroup.add(wallN);

      const wallS = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.18, 0.38), colorMats[color]);
      wallS.position.set(ycx, 0.10, ycz + 2.76);
      boardGroup.add(wallS);

      const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 5.2), colorMats[color]);
      wallW.position.set(ycx - 2.76, 0.10, ycz);
      boardGroup.add(wallW);

      const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 5.2), colorMats[color]);
      wallE.position.set(ycx + 2.76, 0.10, ycz);
      boardGroup.add(wallE);

      for (const [sx, sz] of COLOR_CONFIG[color].yardCenters) {
        const socketRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.48, 0.055, 14, 28),
          colorMats[color]
        );
        socketRing.rotation.x = Math.PI / 2;
        socketRing.position.set(sx, 0.10, sz);
        socketRing.receiveShadow = true;
        boardGroup.add(socketRing);
      }
    }

    // Center 3D Dice Arena Ring right in the middle of the Ludo Map (0, 0)
    const centerArenaRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.065, 16, 36),
      trimMat
    );
    centerArenaRing.rotation.x = Math.PI / 2;
    centerArenaRing.position.set(0, 0.11, 0);
    boardGroup.add(centerArenaRing);

    const turnGlowMat = new THREE.MeshBasicMaterial({
      color: VIVID_PALETTE.red.mainHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const centerTurnHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1.22, 36),
      turnGlowMat
    );
    centerTurnHalo.rotation.x = -Math.PI / 2;
    centerTurnHalo.position.set(0, 0.10, 0);
    boardGroup.add(centerTurnHalo);

    // Expanding 3D Shockwave Ring for Unchain & Kill Cinematics
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const shockwaveMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.65, 36),
      shockwaveMat
    );
    shockwaveMesh.rotation.x = -Math.PI / 2;
    shockwaveMesh.position.set(0, 0.14, 0);
    shockwaveMesh.visible = false;
    scene.add(shockwaveMesh);

    let shockwaveTimer = 0;
    let shockwaveMaxScale = 3.5;

    function triggerShockwave(
      x: number,
      z: number,
      colorHex: number,
      maxRadius = 3.5
    ) {
      shockwaveMesh.position.set(x, 0.15, z);
      shockwaveMat.color.setHex(colorHex);
      shockwaveMat.opacity = 1;
      shockwaveMesh.scale.set(0.5, 0.5, 1);
      shockwaveMesh.visible = true;
      shockwaveTimer = 0.65;
      shockwaveMaxScale = maxRadius;
    }

    // Cinematic Camera Focus & Impact Shake State
    let cineTimer = 0;
    let cineDuration = 0.9;
    let cineFocusX = 0;
    let cineFocusZ = 0;
    let cineShake = 0;

    function triggerCinematicCamera(
      focusX: number,
      focusZ: number,
      duration: number,
      shakeIntensity: number
    ) {
      cineFocusX = focusX;
      cineFocusZ = focusZ;
      cineDuration = duration;
      cineTimer = duration;
      cineShake = shakeIntensity;
    }

    // Interactive 3D Dice Cube right in the middle of the board (0, y, 0)
    const diceMaterials = [
      new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(3, maxAniso), roughness: 0.22, metalness: 0.08, envMapIntensity: 0.25 }), // +X
      new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(4, maxAniso), roughness: 0.22, metalness: 0.08, envMapIntensity: 0.25 }), // -X
      new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(1, maxAniso), roughness: 0.22, metalness: 0.08, envMapIntensity: 0.25 }), // +Y (top = 1)
      new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(6, maxAniso), roughness: 0.22, metalness: 0.08, envMapIntensity: 0.25 }), // -Y (bottom = 6)
      new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(2, maxAniso), roughness: 0.22, metalness: 0.08, envMapIntensity: 0.25 }), // +Z
      new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(5, maxAniso), roughness: 0.22, metalness: 0.08, envMapIntensity: 0.25 }), // -Z
    ];
    const diceMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 1.18, 1.18),
      diceMaterials
    );
    diceMesh.position.set(0, 0.82, 0);
    diceMesh.castShadow = true;
    diceMesh.userData = { type: 'dice' };
    scene.add(diceMesh);

    const diceHitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 2.2, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    diceHitbox.position.set(0, 0.9, 0);
    diceHitbox.userData = { type: 'dice' };
    scene.add(diceHitbox);

    // Ground-pinned Dynamic Drop Shadow for the 3D Center Dice
    const diceShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const diceShadowMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.82, 32),
      diceShadowMat
    );
    diceShadowMesh.rotation.x = -Math.PI / 2;
    diceShadowMesh.position.set(0, 0.115, 0);
    scene.add(diceShadowMesh);

    const diceTopRotations: Record<number, [number, number, number]> = {
      1: [0, 0, 0],
      6: [Math.PI, 0, 0],
      2: [-Math.PI / 2, 0, 0],
      5: [Math.PI / 2, 0, 0],
      3: [0, 0, Math.PI / 2],
      4: [0, 0, -Math.PI / 2],
    };

    let diceSpinTimer = 0;
    let diceTargetRot: [number, number, number] = [0, 0, 0];

    // 16 Sculpted 3D Checker Actors with Ground-Pinned Dynamic 3D Drop Shadows & Step Walking
    interface TokenActor {
      color: PlayerColor;
      tokenIndex: number;
      group: THREE.Group;
      shadowGroup: THREE.Group;
      umbraMat: THREE.MeshBasicMaterial;
      penumbraMat: THREE.MeshBasicMaterial;
      umbraMesh: THREE.Mesh;
      penumbraMesh: THREE.Mesh;
      ringMesh: THREE.Mesh;
      chainGroup: THREE.Group;
      hitbox: THREE.Mesh;
      logicalStep: number;
      walkQueue: number[];
      stepStartX: number;
      stepStartZ: number;
      stepTargetX: number;
      stepTargetZ: number;
      stepProgress: number;
      currentX: number;
      currentY: number;
      currentZ: number;
      specialMode: 'none' | 'unchain' | 'kill_strike' | 'knocked_to_chain';
      specialTimer: number;
      pendingCaptureTarget?: {
        victimColor: PlayerColor;
        victimIdx: number;
        tx: number;
        tz: number;
      };
    }

    const tokenActors: Record<PlayerColor, TokenActor[]> = {
      red: [],
      green: [],
      yellow: [],
      blue: [],
    };
    const tokensContainer = new THREE.Group();
    scene.add(tokensContainer);

    const interactables: THREE.Object3D[] = [diceMesh, diceHitbox];
    const hitboxGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.9, 12);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });

    function buildAllTokenMeshes(activeSkin: TokenSkinId) {
      while (tokensContainer.children.length > 0) {
        tokensContainer.remove(tokensContainer.children[0]);
      }
      interactables.length = 2;

      for (const color of PLAYER_ORDER) {
        tokenActors[color] = [];
        for (let idx = 0; idx < 4; idx++) {
          const step = stateRef.current.matchState.tokens[color][idx].step;
          const [ix, iz] = getTokenBoardCoord(
            color,
            idx,
            step,
            stateRef.current.matchState.tokens
          );
          const {
            group,
            shadowGroup,
            umbraMat,
            penumbraMat,
            umbraMesh,
            penumbraMesh,
            ringMesh,
            chainGroup,
          } = buildSculpted3DCheckerGroup(color, activeSkin, contactShadowTex);
          group.position.set(ix, 0.09, iz);
          shadowGroup.position.set(ix, 0.09, iz);
          chainGroup.visible = step === -1;

          const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
          hitbox.position.y = 0.35;
          hitbox.userData = { type: 'token', color, tokenIndex: idx };
          group.add(hitbox);
          interactables.push(hitbox);

          tokensContainer.add(shadowGroup);
          tokensContainer.add(group);
          tokenActors[color].push({
            color,
            tokenIndex: idx,
            group,
            shadowGroup,
            umbraMat,
            penumbraMat,
            umbraMesh,
            penumbraMesh,
            ringMesh,
            chainGroup,
            hitbox,
            logicalStep: step,
            walkQueue: [],
            stepStartX: ix,
            stepStartZ: iz,
            stepTargetX: ix,
            stepTargetZ: iz,
            stepProgress: 1,
            currentX: ix,
            currentY: 0.09,
            currentZ: iz,
            specialMode: 'none',
            specialTimer: 0,
          });
        }
      }
    }

    buildAllTokenMeshes(stateRef.current.skinId);

    // Zero-GC Pooled Particle Ring Buffer
    const particleGeo = new THREE.OctahedronGeometry(0.14, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      PARTICLE_POOL_SIZE
    );
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particlePool: PooledParticle[] = Array.from(
      { length: PARTICLE_POOL_SIZE },
      () => ({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        scale: 0,
        colorHex: '#fbbf24',
      })
    );
    let particleCursor = 0;

    function spawnBurst(
      x: number,
      y: number,
      z: number,
      hex: string,
      count: number
    ) {
      for (let i = 0; i < count; i++) {
        const p = particlePool[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.6 + Math.random() * 4.2;
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = Math.cos(angle) * speed;
        p.vy = 2.8 + Math.random() * 4.8;
        p.vz = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 0.48 + Math.random() * 0.38;
        p.scale = 0.85 + Math.random() * 0.75;
        p.colorHex = hex;
      }
    }

    sceneRebuildRef.current = {
      applyTheme: (newThemeId: BoardThemeId) => {
        const thm = BOARD_THEMES[newThemeId];
        if (!thm) return;
        frameMat.color.set(thm.boardFrameColor);
        trimMat.color.set(thm.boardTrimColor);
        const nextMapTex = createFullLudoMapTexture(thm.tileBaseColor, maxAniso);
        mapSurfaceMat.map = nextMapTex;
        mapSurfaceMat.needsUpdate = true;
        mapTex.dispose();
        mapTex = nextMapTex;
      },
      rebuildTokens: (newSkinId: TokenSkinId) => {
        buildAllTokenMeshes(newSkinId);
      },
      triggerDiceAnimation: (val: number) => {
        diceSpinTimer = 0.58;
        diceTargetRot = diceTopRotations[val] || [0, 0, 0];
      },
      spawnBurst,
      triggerShockwave,
      triggerCinematicCamera,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for Clicking 3D Checkers & Center 3D Dice
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 14) return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        if (hitObj.userData.type === 'dice') {
          stateRef.current.onRollDiceClick();
        } else if (hitObj.userData.type === 'token') {
          stateRef.current.onSelectToken(
            hitObj.userData.color,
            hitObj.userData.tokenIndex
          );
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 300);
      const h = Math.max(container.clientHeight, 300);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let isDisposed = false;
    let lastTimeMs = performance.now();
    const startTimeMs = lastTimeMs;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (isDisposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const nowMs = performance.now();
      const rawDt = (nowMs - lastTimeMs) / 1000;
      lastTimeMs = nowMs;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      const elapsed = (nowMs - startTimeMs) / 1000;

      const { matchState: ms, cameraPreset: preset } = stateRef.current;
      const aspectScale =
        camera.aspect < 1 ? Math.min(1.4, 1 / Math.max(0.65, camera.aspect)) : 1;

      // 1. Camera Choreography + Cinematic Zoom on Unchain / Kill
      if (cineTimer > 0) {
        cineTimer = Math.max(0, cineTimer - dt);
        const shakeOffset =
          cineShake > 0
            ? Math.sin(elapsed * 55) * cineShake * (cineTimer / cineDuration)
            : 0;
        _camTargetPos.set(
          cineFocusX * 0.55 + shakeOffset,
          11.2 * aspectScale,
          cineFocusZ * 0.55 + 4.8 * aspectScale + shakeOffset
        );
        _camLookTarget.set(cineFocusX * 0.65, 0.2, cineFocusZ * 0.65);
        camera.position.lerp(_camTargetPos, 1 - Math.exp(-7 * dt));
        controls.target.lerp(_camLookTarget, 1 - Math.exp(-7 * dt));
      } else {
        if (preset === 'top') {
          _camTargetPos.set(0, 21.0 * aspectScale, 0.01);
          _camLookTarget.set(0, 0, 0);
        } else {
          _camTargetPos.set(0, 17.8 * aspectScale, 6.6 * aspectScale);
          _camLookTarget.set(0, -0.2, 0.35);
        }
        camera.position.lerp(_camTargetPos, 1 - Math.exp(-5 * dt));
        controls.target.lerp(_camLookTarget, 1 - Math.exp(-5 * dt));
      }
      controls.update();

      // 2. Update Expanding 3D Shockwave Ring
      if (shockwaveTimer > 0) {
        shockwaveTimer = Math.max(0, shockwaveTimer - dt);
        const p = 1 - shockwaveTimer / 0.65;
        const sc = 0.5 + p * shockwaveMaxScale;
        shockwaveMesh.scale.set(sc, sc, 1);
        shockwaveMat.opacity = Math.max(0, 1 - p * p);
        if (shockwaveTimer === 0) {
          shockwaveMesh.visible = false;
        }
      }

      // 3. Update Center Turn Halo & 3D Rolling Dice in the Middle
      turnGlowMat.color.setHex(VIVID_PALETTE[ms.currentTurn].mainHex);
      const pulseScale = 1 + Math.sin(elapsed * 5) * 0.06;
      centerTurnHalo.scale.set(pulseScale, pulseScale, 1);

      if (diceSpinTimer > 0) {
        diceSpinTimer = Math.max(0, diceSpinTimer - dt);
        const norm = diceSpinTimer / 0.58;
        diceMesh.position.y = 0.85 + Math.abs(Math.sin(norm * Math.PI * 2.2)) * 2.1;
        diceMesh.position.x = Math.sin(norm * Math.PI * 4) * 0.35 * norm;
        diceMesh.position.z = Math.cos(norm * Math.PI * 3) * 0.35 * norm;
        diceMesh.rotation.x += dt * 24;
        diceMesh.rotation.y += dt * 28;
        diceMesh.rotation.z += dt * 19;
      } else {
        const waitRollHover =
          ms.turnPhase === 'WAIT_ROLL' ? 0.92 + Math.sin(elapsed * 4) * 0.10 : 0.72;
        diceMesh.position.x = THREE.MathUtils.damp(diceMesh.position.x, 0, 10, dt);
        diceMesh.position.z = THREE.MathUtils.damp(diceMesh.position.z, 0, 10, dt);
        diceMesh.position.y = THREE.MathUtils.damp(
          diceMesh.position.y,
          waitRollHover,
          8,
          dt
        );
        diceMesh.rotation.x = THREE.MathUtils.damp(
          diceMesh.rotation.x,
          diceTargetRot[0],
          10,
          dt
        );
        diceMesh.rotation.y = THREE.MathUtils.damp(
          diceMesh.rotation.y,
          diceTargetRot[1],
          10,
          dt
        );
        diceMesh.rotation.z = THREE.MathUtils.damp(
          diceMesh.rotation.z,
          diceTargetRot[2],
          10,
          dt
        );
      }

      // Adjust Center 3D Dice Ground Drop Shadow based on dice height above board
      const diceHeight = Math.max(0, diceMesh.position.y - 0.68);
      diceShadowMesh.position.set(
        diceMesh.position.x + diceHeight * 0.22,
        0.115,
        diceMesh.position.z + diceHeight * 0.26
      );
      const diceShadowScale = 1 + diceHeight * 0.35;
      diceShadowMesh.scale.set(diceShadowScale, diceShadowScale, 1);
      diceShadowMat.opacity = Math.max(0.24, 0.82 / (1 + diceHeight * 0.55));

      // 4. Detect State Transitions & Update 16 Checkers with Step-by-Step Walking + Cinematics
      for (const color of PLAYER_ORDER) {
        const isCurrentTurn = ms.currentTurn === color && ms.turnPhase === 'WAIT_MOVE';
        for (let idx = 0; idx < 4; idx++) {
          const actor = tokenActors[color][idx];
          if (!actor) continue;
          const tokenState = ms.tokens[color][idx];

          // Detect when logical step changes in matchState
          if (tokenState.step !== actor.logicalStep) {
            const prevStep = actor.logicalStep;
            const nextStep = tokenState.step;
            actor.logicalStep = nextStep;

            if (prevStep === -1 && nextStep === 0) {
              // CINEMATIC 1: Breaking out of the Yard Chain!
              actor.walkQueue = [];
              const [sx, sz] = getTokenBoardCoord(color, idx, -1, ms.tokens);
              const [tx, tz] = getTokenBoardCoord(color, idx, 0, ms.tokens);
              actor.stepStartX = sx;
              actor.stepStartZ = sz;
              actor.stepTargetX = tx;
              actor.stepTargetZ = tz;
              actor.stepProgress = 0;
              actor.specialMode = 'unchain';
              actor.specialTimer = 0.78;
              actor.chainGroup.visible = false;

              // Shatter chain burst + shockwave + camera swoop
              spawnBurst(sx, 0.5, sz, '#fbbf24', 24);
              spawnBurst(tx, 0.4, tz, COLOR_CONFIG[color].hex, 16);
              triggerShockwave(sx, sz, 0xfbbf24, 3.2);
              triggerCinematicCamera((sx + tx) * 0.5, (sz + tz) * 0.5, 0.95, 0.08);
            } else if (prevStep >= 0 && nextStep > prevStep) {
              // STEP-BY-STEP WALKING: Enqueue every single tile step [prevStep + 1 ... nextStep]
              for (let s = prevStep + 1; s <= nextStep; s++) {
                actor.walkQueue.push(s);
              }
              const lm = ms.lastMove;
              if (
                lm &&
                lm.player === color &&
                lm.tokenIndex === idx &&
                lm.capturedToken
              ) {
                const [kx, kz] = getTokenBoardCoord(color, idx, nextStep, ms.tokens);
                actor.pendingCaptureTarget = {
                  victimColor: lm.capturedToken.color,
                  victimIdx: lm.capturedToken.tokenIndex,
                  tx: kx,
                  tz: kz,
                };
              }
            } else if (prevStep >= 0 && nextStep === -1) {
              // Knocked back to Yard Chain!
              actor.walkQueue = [];
              actor.stepStartX = actor.currentX;
              actor.stepStartZ = actor.currentZ;
              const [yx, yz] = getTokenBoardCoord(color, idx, -1, ms.tokens);
              actor.stepTargetX = yx;
              actor.stepTargetZ = yz;
              actor.stepProgress = 0;
              actor.specialMode = 'knocked_to_chain';
              actor.specialTimer = 0.85;
            } else {
              actor.walkQueue = [];
              const [tx, tz] = getTokenBoardCoord(color, idx, nextStep, ms.tokens);
              actor.currentX = tx;
              actor.currentZ = tz;
              actor.stepTargetX = tx;
              actor.stepTargetZ = tz;
              actor.stepProgress = 1;
              actor.chainGroup.visible = nextStep === -1;
            }
          }

          const isValidMove = isCurrentTurn && ms.validMoves.includes(idx);

          // Advance Special Cinematics or Step-by-Step Walking
          if (actor.specialMode === 'unchain') {
            actor.specialTimer = Math.max(0, actor.specialTimer - dt);
            const t = 1 - actor.specialTimer / 0.78;
            const ease = 1 - Math.pow(1 - t, 3);
            actor.currentX =
              actor.stepStartX + (actor.stepTargetX - actor.stepStartX) * ease;
            actor.currentZ =
              actor.stepStartZ + (actor.stepTargetZ - actor.stepStartZ) * ease;
            actor.currentY = 0.09 + Math.sin(t * Math.PI) * 2.15;
            actor.group.rotation.y = t * Math.PI * 4;
            actor.group.rotation.z = Math.sin(t * Math.PI * 2) * 0.28;

            if (actor.specialTimer === 0) {
              actor.specialMode = 'none';
              actor.group.rotation.set(0, 0, 0);
              triggerShockwave(
                actor.stepTargetX,
                actor.stepTargetZ,
                VIVID_PALETTE[color].mainHex,
                2.6
              );
            }
          } else if (actor.specialMode === 'kill_strike') {
            actor.specialTimer = Math.max(0, actor.specialTimer - dt);
            const t = 1 - actor.specialTimer / 0.52;
            actor.currentY = 0.09 + Math.sin(t * Math.PI) * 1.95;
            const scalePulse = 1 + Math.sin(t * Math.PI) * 0.32;
            actor.group.scale.set(scalePulse, scalePulse, scalePulse);
            if (actor.specialTimer === 0) {
              actor.specialMode = 'none';
              actor.group.scale.set(1, 1, 1);
            }
          } else if (actor.specialMode === 'knocked_to_chain') {
            actor.specialTimer = Math.max(0, actor.specialTimer - dt);
            const t = 1 - actor.specialTimer / 0.85;
            actor.currentX =
              actor.stepStartX + (actor.stepTargetX - actor.stepStartX) * t;
            actor.currentZ =
              actor.stepStartZ + (actor.stepTargetZ - actor.stepStartZ) * t;
            actor.currentY = 0.09 + Math.sin(t * Math.PI) * 2.6;
            actor.group.rotation.x = t * Math.PI * 6;
            actor.group.rotation.z = t * Math.PI * 4;

            if (actor.specialTimer === 0) {
              actor.specialMode = 'none';
              actor.group.rotation.set(0, 0, 0);
              actor.chainGroup.visible = true;
              spawnBurst(actor.stepTargetX, 0.35, actor.stepTargetZ, '#94a3b8', 14);
            }
          } else if (actor.stepProgress < 1) {
            // Currently hopping a single tile step! (0.155s per tile)
            actor.stepProgress = Math.min(1, actor.stepProgress + dt / 0.155);
            const p = actor.stepProgress;
            actor.currentX =
              actor.stepStartX + (actor.stepTargetX - actor.stepStartX) * p;
            actor.currentZ =
              actor.stepStartZ + (actor.stepTargetZ - actor.stepStartZ) * p;
            actor.currentY = 0.09 + Math.sin(p * Math.PI) * 0.78;

            const dx = actor.stepTargetX - actor.stepStartX;
            const dz = actor.stepTargetZ - actor.stepStartZ;
            const tilt = Math.sin(p * Math.PI) * 0.18;
            actor.group.rotation.z = -Math.sign(dx) * tilt;
            actor.group.rotation.x = Math.sign(dz) * tilt;

            if (actor.stepProgress >= 1) {
              actor.group.rotation.set(0, 0, 0);
              soundFX.playTokenStep();
              spawnBurst(
                actor.currentX,
                0.15,
                actor.currentZ,
                COLOR_CONFIG[color].hex,
                4
              );

              if (actor.walkQueue.length === 0 && actor.pendingCaptureTarget) {
                const cap = actor.pendingCaptureTarget;
                actor.pendingCaptureTarget = undefined;
                actor.specialMode = 'kill_strike';
                actor.specialTimer = 0.52;
                soundFX.playCaptureHit();
                spawnBurst(cap.tx, 0.65, cap.tz, '#ef4444', 36);
                spawnBurst(cap.tx, 0.85, cap.tz, '#fbbf24', 20);
                triggerShockwave(cap.tx, cap.tz, 0xef4444, 4.2);
                triggerCinematicCamera(cap.tx, cap.tz, 1.05, 0.22);
              }
            }
          } else if (actor.walkQueue.length > 0) {
            const nextTileStep = actor.walkQueue.shift()!;
            actor.stepStartX = actor.currentX;
            actor.stepStartZ = actor.currentZ;
            let [nx, nz] = getTokenBoardCoord(color, idx, nextTileStep, ms.tokens);
            if (nextTileStep === 56) {
              nx *= 1.25;
              nz *= 1.25;
            }
            actor.stepTargetX = nx;
            actor.stepTargetZ = nz;
            actor.stepProgress = 0;
          } else {
            // Idle on current tile (levitate slightly when selectable to showcase dynamic shadow)
            let [tx, tz] = getTokenBoardCoord(
              color,
              idx,
              tokenState.step,
              ms.tokens
            );
            if (tokenState.step === 56) {
              tx *= 1.25;
              tz *= 1.25;
            }
            const hoverLift = isValidMove
              ? (Math.sin(elapsed * 6.5 + idx) + 1) * 0.16
              : 0;
            actor.currentX = THREE.MathUtils.damp(actor.currentX, tx, 10, dt);
            actor.currentZ = THREE.MathUtils.damp(actor.currentZ, tz, 10, dt);
            actor.currentY = THREE.MathUtils.damp(
              actor.currentY,
              0.09 + hoverLift,
              12,
              dt
            );
            actor.chainGroup.visible = tokenState.step === -1;
          }

          actor.group.position.set(
            actor.currentX,
            actor.currentY,
            actor.currentZ
          );

          // Update Ground-Pinned Dynamic 3D Drop Shadow based on height above board (h >= 0)
          const heightAboveBoard = Math.max(0, actor.currentY - 0.14);
          // Shift shadow along directional keyLight vector (-7, 18, 9 -> +X, +Z shadow projection)
          // Even at rest (heightAboveBoard = 0), the tall 3D checker body casts a distinct directional drop shadow
          const shadowOffsetX = 0.14 + heightAboveBoard * 0.32;
          const shadowOffsetZ = 0.20 + heightAboveBoard * 0.38;
          actor.shadowGroup.position.set(
            actor.currentX + shadowOffsetX,
            0.09,
            actor.currentZ + shadowOffsetZ
          );
          // Keep selection halo centered directly under checker X/Z
          actor.ringMesh.position.set(-shadowOffsetX, 0.055, -shadowOffsetZ);

          // Penumbra expands & diffuses outward with height; Umbra tightens & darkens on contact
          const penumbraScale = 1.0 + heightAboveBoard * 0.58;
          actor.penumbraMesh.scale.set(penumbraScale, penumbraScale, 1);
          actor.penumbraMat.opacity = Math.max(
            0.22,
            0.80 / (1 + heightAboveBoard * 0.65)
          );

          // Umbra stays tighter and slightly closer to the checker base than the outer penumbra
          actor.umbraMesh.position.set(
            -shadowOffsetX * 0.28,
            0.05,
            -shadowOffsetZ * 0.28
          );
          const umbraScale = Math.max(0.34, 1.0 - heightAboveBoard * 0.32);
          actor.umbraMesh.scale.set(umbraScale, umbraScale, 1);
          actor.umbraMat.opacity = Math.max(
            0.12,
            0.94 * Math.exp(-heightAboveBoard * 1.15)
          );

          // Animate lock chain rattle or valid-move highlight
          actor.ringMesh.visible = isValidMove;
          if (actor.specialMode !== 'kill_strike') {
            if (isValidMove) {
              actor.group.scale.set(1.06, 1.06, 1.06);
              actor.ringMesh.rotation.z = elapsed * 2.5;
              if (tokenState.step === -1) {
                actor.chainGroup.rotation.y = Math.sin(elapsed * 22) * 0.15;
              }
            } else {
              actor.group.scale.set(1, 1, 1);
              actor.chainGroup.rotation.y = 0;
            }
          }
        }
      }

      // 5. Update Pooled Particles
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = particlePool[i];
        if (p.active) {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            _dummyPos.set(0, -100, 0);
            _dummyScale.set(0, 0, 0);
          } else {
            p.vy -= 9.8 * dt;
            p.x += p.vx * dt;
            p.y = Math.max(0.15, p.y + p.vy * dt);
            p.z += p.vz * dt;
            const s = p.scale * (1 - p.life / p.maxLife);
            _dummyPos.set(p.x, p.y, p.z);
            _dummyScale.set(s, s, s);
            _dummyColor.set(p.colorHex);
            particleInstanced.setColorAt(i, _dummyColor);
          }
        } else {
          _dummyPos.set(0, -100, 0);
          _dummyScale.set(0, 0, 0);
        }
        _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
        particleInstanced.setMatrixAt(i, _dummyMat);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (particleInstanced.instanceColor) {
        particleInstanced.instanceColor.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="ludo-3d-canvas"
      className="w-full h-full overflow-hidden z-0"
    />
  );
};
