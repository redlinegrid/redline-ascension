import { useEffect, useMemo, useState } from "react";
import { applyStartingUpgrade, buildSynergies, CAMPAIGN_LENGTH, createRace, draftUpgradeCards, DRIVER_MARKET, ensureFullGrid, formatLapTime, getStrategyAdvice, setDriverStrategy, standings, stepRace, upgradeCar, type CarState, type Pace, type RaceState, type StrategyAdvice, type Tyre } from "./simulation";

const SAVE_KEY = "redline-paddock-prototype-v1";
const BEST_RUN_KEY = "redline-paddock-best-run-v1";
const GARAGE_META_KEY = "redline-paddock-garage-meta-v1";
type GarageMeta = { research: number; unlocks: string[]; rewardedRuns: string[] };
const EMPTY_GARAGE_META: GarageMeta = { research: 0, unlocks: [], rewardedRuns: [] };
function loadGarageMeta(): GarageMeta {
  try {
    const raw = localStorage.getItem(GARAGE_META_KEY);
    if (!raw) return EMPTY_GARAGE_META;
    const parsed = JSON.parse(raw) as Partial<GarageMeta>;
    return { research: Math.max(0, Number(parsed.research) || 0), unlocks: Array.isArray(parsed.unlocks) ? parsed.unlocks.filter((id): id is string => typeof id === "string") : [], rewardedRuns: Array.isArray(parsed.rewardedRuns) ? parsed.rewardedRuns.filter((id): id is string => typeof id === "string") : [] };
  } catch { return EMPTY_GARAGE_META; }
}
const GARAGE_PERKS = [
  { id: "aero-blueprint", title: "Aero Blueprint", category: "ENGINEERING", description: "Start each new career with +1 aerodynamics module.", cost: 3 },
  { id: "power-mapping", title: "Power Mapping", category: "POWER UNIT", description: "Start each new career with +1 power module.", cost: 3 },
  { id: "sponsor-network", title: "Sponsor Network", category: "COMMERCIAL", description: "Start each new career with RM500,000 extra funding.", cost: 4 },
] as const;
type BestRun = { points: number; position: number; seed: number };
const money = (amount: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(amount);
const pct = (value: number) => Math.round(value) + "%";
const TEAM_COLOR_PRESETS = [
  { name: "Racing Red", primary: "#f04438", secondary: "#f2f2f2" },
  { name: "Midnight Blue", primary: "#2864dc", secondary: "#dce9ff" },
  { name: "Emerald", primary: "#16a36a", secondary: "#e0ffef" },
  { name: "Solar Gold", primary: "#e8b323", secondary: "#17191f" },
  { name: "Violet", primary: "#8657d8", secondary: "#f0e6ff" },
  { name: "Arctic", primary: "#49b9d1", secondary: "#10232b" },
  { name: "Graphite", primary: "#777f8d", secondary: "#f2f2f2" },
  { name: "Hot Pink", primary: "#ec4f9b", secondary: "#fff0f7" },
  { name: "Orange", primary: "#f07828", secondary: "#fff0dc" },
  { name: "Lime", primary: "#9bbf35", secondary: "#18210b" },
] as const;
const SAVE_CODE_PREFIX = "RLP1";
function checksum(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36).toUpperCase();
}
function encodeSaveCode(payload: unknown) {
  const json = JSON.stringify(payload);
  const bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return SAVE_CODE_PREFIX + "." + btoa(bytes) + "." + checksum(json);
}
function decodeSaveCode(code: string): any {
  const parts = code.trim().replace(/\s+/g, "").split(".");
  if (parts.length !== 3 || parts[0] !== SAVE_CODE_PREFIX) throw new Error("This doesn't look like a Redline Paddock save code.");
  let json = "";
  try {
    const bytes = atob(parts[1]);
    const escaped = Array.from(bytes, (char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join("");
    json = decodeURIComponent(escaped);
  } catch { throw new Error("The save code is incomplete or damaged."); }
  if (checksum(json) !== parts[2]) throw new Error("Save code verification failed. Check that the entire code was copied.");
  const payload = JSON.parse(json);
  if (payload?.format !== 1 || payload?.race?.version !== 1 || !Array.isArray(payload?.race?.cars) || payload.race.cars.length < 10) throw new Error("This save is not compatible with this version of Redline Paddock.");
  if (!payload.garageMeta || !Array.isArray(payload.garageMeta.unlocks) || !Array.isArray(payload.garageMeta.rewardedRuns)) throw new Error("The save code is missing Garage progression data.");
  return payload;
}

function loadRace(): RaceState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as RaceState;
      if (saved.version === 1 && Array.isArray(saved.cars) && saved.cars.length >= 10) return ensureFullGrid({ ...saved, upgradeModules: saved.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 } });
    }
  } catch { /* Ignore a damaged local save and start a new career. */ }
  return createRace();
}

function seededTrack(seed: number) {
  let value = seed >>> 0;
  const rand = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  // Original procedural layouts, shaped around real circuit archetypes rather than one oval formula.
  // Coordinates are normalized to the map canvas; each seed picks a distinct family and subtly varies it.
  const layouts: [number, number][][] = [
    // Fast, flowing GP circuit: long straights, sweeping direction changes and a tight final section.
    [[.16,.30],[.34,.22],[.49,.25],[.60,.34],[.72,.25],[.85,.29],[.91,.40],[.84,.49],[.72,.46],[.65,.54],[.78,.65],[.83,.77],[.75,.84],[.60,.81],[.54,.70],[.42,.69],[.35,.82],[.23,.85],[.13,.77],[.17,.65],[.27,.59],[.22,.49],[.12,.47],[.09,.38]],
    // Street-style layout: narrow straights, square corners and a tight central hairpin.
    [[.13,.24],[.39,.24],[.43,.31],[.43,.40],[.34,.43],[.31,.49],[.37,.54],[.63,.54],[.70,.49],[.70,.39],[.77,.34],[.88,.37],[.91,.47],[.86,.56],[.79,.59],[.78,.70],[.70,.77],[.53,.77],[.49,.69],[.49,.63],[.38,.63],[.29,.70],[.17,.69],[.11,.61],[.13,.50],[.20,.45],[.20,.36]],
    // Technical S-curves and crossover-like middle section, inspired by classic driver circuits.
    [[.12,.70],[.20,.79],[.34,.79],[.41,.70],[.35,.62],[.24,.60],[.19,.52],[.23,.43],[.35,.40],[.43,.46],[.49,.55],[.56,.55],[.62,.45],[.58,.34],[.49,.30],[.44,.23],[.51,.17],[.66,.18],[.77,.26],[.82,.38],[.78,.49],[.69,.56],[.72,.66],[.83,.71],[.86,.80],[.76,.86],[.60,.85],[.52,.77],[.43,.72]],
    // Long back straight and deep hairpin: asymmetric, endurance-style silhouette.
    [[.10,.34],[.28,.29],[.49,.29],[.72,.27],[.86,.30],[.91,.38],[.89,.48],[.82,.53],[.71,.51],[.66,.58],[.70,.68],[.82,.72],[.85,.81],[.77,.87],[.61,.85],[.51,.78],[.46,.67],[.38,.62],[.29,.66],[.25,.77],[.16,.81],[.09,.75],[.12,.64],[.20,.57],[.22,.48],[.14,.45]],
    // Compact, angular park circuit with a sequence of linked corners.
    [[.18,.25],[.34,.20],[.47,.25],[.53,.33],[.65,.28],[.78,.30],[.86,.39],[.82,.47],[.72,.48],[.67,.42],[.59,.47],[.60,.57],[.72,.60],[.83,.57],[.89,.65],[.84,.76],[.70,.81],[.61,.75],[.51,.70],[.42,.77],[.28,.81],[.17,.76],[.12,.66],[.19,.58],[.30,.56],[.34,.48],[.26,.43],[.14,.44],[.11,.34]]
  ];
  const layout = layouts[Math.floor(rand() * layouts.length)];
  const scaleX = 284;
  const scaleY = 164;
  const rotation = (rand() - 0.5) * 0.14;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return layout.map(([nx, ny]) => {
    const x = (nx - 0.5) * scaleX;
    const y = (ny - 0.5) * scaleY;
    const jitterX = (rand() - 0.5) * 7;
    const jitterY = (rand() - 0.5) * 7;
    return [
      Math.max(35, Math.min(345, 190 + x * cos - y * sin + jitterX)),
      Math.max(22, Math.min(198, 110 + x * sin + y * cos + jitterY))
    ] as [number, number];
  });
}

function smoothTrackPath(points: readonly (readonly [number, number])[]) {
  const midpoint = (a: readonly [number, number], b: readonly [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = midpoint(points[points.length - 1], points[0]);
  let path = "M " + first[0] + " " + first[1];
  for (let i = 0; i < points.length; i++) {
    const next = midpoint(points[i], points[(i + 1) % points.length]);
    path += " Q " + points[i][0] + " " + points[i][1] + " " + next[0] + " " + next[1];
  }
  return path + " Z";
}

function trackPosition(progress: number, points: readonly (readonly [number, number])[]) {
  const segments = points.map((point, index) => Math.hypot(points[(index + 1) % points.length][0] - point[0], points[(index + 1) % points.length][1] - point[1]));
  const totalLength = segments.reduce((total, length) => total + length, 0);
  let distance = (((progress % 1) + 1) % 1) * totalLength;
  for (let index = 0; index < points.length; index++) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const segmentLength = segments[index];
    if (distance <= segmentLength || index === points.length - 1) {
      const fraction = segmentLength === 0 ? 0 : distance / segmentLength;
      return { x: a[0] + (b[0] - a[0]) * fraction, y: a[1] + (b[1] - a[1]) * fraction };
    }
    distance -= segmentLength;
  }
  return { x: points[0][0], y: points[0][1] };
}

function CircuitMap({ cars, lap, teamName, circuitSeed = 8241, circuitName = "Copperhead Ring" }: { cars: CarState[]; lap: number; teamName: string; circuitSeed?: number; circuitName?: string }) {
  const trackPoints = useMemo(() => seededTrack(circuitSeed), [circuitSeed]);
  const trackPath = useMemo(() => smoothTrackPath(trackPoints), [trackPoints]);
  const points = useMemo(() => cars.map((car) => ({ ...car, ...trackPosition(car.progress, trackPoints) })), [cars, trackPoints]);
  const startFinish = trackPosition(0, trackPoints);
  const sectorOne = trackPosition(1 / 3, trackPoints);
  const sectorTwo = trackPosition(2 / 3, trackPoints);
  return <div className="circuit-wrap circuit-theme">
    <div className="circuit-hud"><span><i /> CIRCUIT TELEMETRY</span><b>SEED {circuitSeed.toString(16).toUpperCase().padStart(6, "0").slice(-6)}</b></div>
    <svg viewBox="0 0 380 220" role="img" aria-label={"Live circuit map for " + circuitName}>
      <defs>
        <filter id="player-glow" x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      {/* Redline Grid-inspired circuit treatment: clean white outline on black, with restrained sector colours. */}
      <path d={trackPath} fill="none" stroke="#000000" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d={trackPath} fill="none" stroke="#f0f2f6" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={trackPath} pathLength="300" fill="none" stroke="#ff453a" strokeWidth="2" strokeDasharray="100 200" strokeDashoffset="0" strokeLinecap="butt" />
      <path d={trackPath} pathLength="300" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="100 200" strokeDashoffset="-100" strokeLinecap="butt" />
      <path d={trackPath} pathLength="300" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="100 200" strokeDashoffset="-200" strokeLinecap="butt" />
      <g transform={"translate(" + startFinish.x + " " + startFinish.y + ")"}>
        <circle r="7" fill="#050609" stroke="#f4f5f7" strokeWidth="1.4" />
        <path d="M-5 -5h10v10h-10z" fill="#f4f5f7" />
        <path d="M-5 -5h5v5h-5zM0 0h5v5H0z" fill="#050609" />
      </g>
      <text x={startFinish.x + 12} y={startFinish.y - 12} className="track-marker-label">START / FINISH</text>
      <g className="track-sector sector-one" transform={"translate(" + sectorOne.x + " " + sectorOne.y + ")"}><circle r="7" /><text y="2.5">S1</text></g>
      <g className="track-sector sector-two" transform={"translate(" + sectorTwo.x + " " + sectorTwo.y + ")"}><circle r="7" /><text y="2.5">S2</text></g>
      <g className="track-core">
        <text x="190" y="105" textAnchor="middle" className="track-center-label">LAP {String(lap).padStart(2, "0")}</text>
        <text x="190" y="118" textAnchor="middle" className="track-center-sub">{circuitName.toUpperCase()}</text>
        <text x="190" y="131" textAnchor="middle" className="track-center-live">● LIVE TIMING</text>
      </g>
      {points.map((car) => <g key={car.id}>
        {car.playerCar && <circle cx={car.x} cy={car.y} r="10" fill={car.teamColor} opacity=".2" filter="url(#player-glow)" />}
        {car.playerCar && <circle cx={car.x} cy={car.y} r="7" fill={car.teamColor} opacity=".24" />}
        <circle cx={car.x} cy={car.y} r={car.playerCar ? 4.5 : 2.8} fill={car.teamColor} stroke={car.playerCar ? "#ffffff" : "#11141a"} strokeWidth={car.playerCar ? 1.3 : .8} />
        {car.playerCar && <text x={car.x + 8} y={car.y - 7} className="track-car-label">{car.id === "rp-1" ? "07" : "22"}</text>}
      </g>)}
    </svg>
    <div className="map-legend"><span><i className="dot red" /> {teamName.toUpperCase()}</span><span><i className="dot teal" /> VORTEX</span><span><i className="dot purple" /> APEX</span><span><i className="dot gold" /> NORTHSTAR</span><span><i className="dot blue" /> VELOCITY</span></div>
  </div>;
}


function DriverPortrait({ driver, index }: { driver: { name: string; color: string }; index: number }) {
  const accent = driver.color;
  // Cinematic, photoreal-inspired driver bust silhouettes: varied hairlines, natural head shapes,
  // subtle studio rim-light, racing suit shoulders and no cartoon facial features.
  const profiles = [
    { head: "M29 29 C29 17 36 11 45 11 C55 11 61 19 60 31 L58 42 C56 51 51 57 45 59 C38 56 32 50 30 41Z", hair: "M28 32 C25 20 31 10 41 8 C51 5 60 13 62 23 L60 34 L55 25 C48 28 39 24 34 20 L32 33Z", fringe: "M31 22 C37 25 47 27 56 23 L55 29 C48 31 39 29 33 26Z" },
    { head: "M31 29 C31 18 37 12 45 12 C54 12 59 20 59 31 L57 42 C55 50 50 56 45 58 C39 55 34 49 32 41Z", hair: "M29 29 C28 18 34 10 43 9 C53 8 60 15 60 25 L57 31 L54 20 C48 24 39 23 33 20 L32 31Z", fringe: "M33 20 C39 24 48 24 55 20 L54 26 C47 29 39 27 33 24Z" },
    { head: "M30 28 C30 17 37 12 45 12 C54 12 60 19 59 31 L57 41 C55 50 50 56 44 58 C37 55 32 49 31 40Z", hair: "M28 32 C27 19 34 10 44 9 C54 8 61 16 61 27 L58 34 L54 22 C47 25 39 24 33 21 L32 33Z", fringe: "M32 21 C38 24 46 25 55 21 L55 27 C47 29 39 28 33 25Z" },
    { head: "M31 28 C31 18 37 12 45 12 C54 12 59 20 59 31 L57 42 C55 50 50 55 45 58 C39 55 34 49 32 41Z", hair: "M29 29 C28 17 36 9 45 9 C55 9 61 17 60 27 L58 33 L54 22 C48 25 40 24 34 20 L32 31Z", fringe: "M33 21 C39 25 48 25 55 22 L54 27 C47 30 39 28 33 25Z" }
  ];
  const profile = profiles[index % profiles.length];
  const id = "portrait-" + index;
  return <div className="driver-portrait" style={{ "--driver-accent": accent } as React.CSSProperties} aria-label={driver.name + " portrait"}>
    <svg viewBox="0 0 88 94" role="img" aria-label={"Driver silhouette of " + driver.name} focusable="false">
      <defs>
        <linearGradient id={id + "-studio"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#858b96" stopOpacity=".58" />
          <stop offset="38%" stopColor="#333741" stopOpacity=".32" />
          <stop offset="100%" stopColor="#07090d" stopOpacity=".98" />
        </linearGradient>
        <linearGradient id={id + "-skinrim"} x1="0" y1="0" x2="1" y2=".1">
          <stop offset="0%" stopColor="#c8ccd2" stopOpacity=".62" />
          <stop offset="52%" stopColor="#737985" stopOpacity=".2" />
          <stop offset="100%" stopColor="#171a20" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id + "-suit"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#363b45" />
          <stop offset="48%" stopColor="#15181f" />
          <stop offset="100%" stopColor="#050609" />
        </linearGradient>
        <filter id={id + "-grain"}>
          <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="2" seed={index + 8} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="table" tableValues="0 .1" /></feComponentTransfer>
        </filter>
        <clipPath id={id + "-clip"}><rect width="88" height="94" rx="1.5" /></clipPath>
      </defs>
      <g clipPath={"url(#" + id + "-clip)"}>
        <rect width="88" height="94" fill="#0b0d12" />
        <rect width="88" height="94" fill={"url(#" + id + "-studio)"} />
        <ellipse cx="44" cy="35" rx="34" ry="43" fill="#9ca2ad" opacity=".055" />
        {/* Shoulder silhouette and high-collar race suit */}
        <path d="M3 98 C5 80 13 71 27 66 L36 62 L53 62 L63 67 C76 71 83 82 86 98Z" fill="#030407" />
        <path d="M13 98 C15 81 23 73 34 69 L44 78 L54 69 C66 73 74 82 76 98Z" fill={"url(#" + id + "-suit)"} />
        <path d="M33 54 L33 67 L44 78 L55 66 L55 53Z" fill="#090b10" />
        <path d="M34 63 L44 75 L54 63 L52 59 L36 59Z" fill="#717782" opacity=".24" />
        <path d="M44 78 L44 94" stroke={accent} strokeWidth="1.3" strokeOpacity=".48" />
        <path d="M17 94 C20 81 25 74 34 70 L40 77 L32 88Z" fill="#454b56" opacity=".26" />
        <path d="M71 94 C68 81 62 74 54 70 L48 77 L56 88Z" fill="#000" opacity=".5" />
        {/* Head shape, ears, and restrained studio edge light */}
        <path d={profile.head} fill="#050609" />
        <path d="M30 34 C26 31 26 38 30 42 L33 43Z" fill="#0a0c11" />
        <path d="M58 34 C63 31 63 38 58 43 L56 43Z" fill="#030407" />
        <path d={profile.hair} fill="#020306" />
        <path d={profile.fringe} fill="#07090d" />
        <path d="M30 31 C29 43 34 54 43 59" fill="none" stroke="#b7bdc7" strokeOpacity=".25" strokeWidth="1.05" />
        <path d="M31 40 C32 49 36 55 42 58" fill="none" stroke="#717783" strokeOpacity=".22" strokeWidth="2.2" />
        <path d="M58 34 C60 43 56 53 49 58" fill="none" stroke="#7b818d" strokeOpacity=".18" strokeWidth="1.1" />
        <path d="M28 31 C26 21 32 12 40 9" fill="none" stroke="#d2d5dc" strokeOpacity=".3" strokeWidth="1.2" />
        {/* Face stays anonymous: no eyes, mouth, or illustrated expression */}
        <path d="M35 31 C36 37 36 43 39 47" fill="none" stroke="#7d838e" strokeOpacity=".1" strokeWidth="1" />
        <path d="M0 0 H88 V94 H0Z" fill={"url(#" + id + "-skinrim)"} />
        <path d="M0 0 H2 V94 H0Z" fill={accent} opacity=".3" />
        <rect width="88" height="94" filter={"url(#" + id + "-grain)"} opacity=".26" />
        <rect x=".5" y=".5" width="87" height="93" fill="none" stroke="#b9bec8" strokeOpacity=".18" />
      </g>
    </svg>
    <span className="driver-portrait-number">{String(index + 1).padStart(2, "0")}</span>
  </div>;
}
function UpgradeIcon({ type }: { type: string | undefined }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg className="upgrade-category-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    {type === "aero" && <g {...common}><path d="M5 27 41 10 32 28 18 31 5 27Z"/><path d="m18 31-5 9 13-11"/><path d="M9 19 4 17M14 14 10 11M21 10 19 5"/></g>}
    {type === "power" && <g {...common}><path d="M13 11h22v5l3 3v16l-4 4H14l-4-4V19l3-3Z"/><path d="M18 11V7h12v4M17 21h14v9H17z"/><path d="M20 25h8M21 34v4M27 34v4M8 23H5M43 23h-3"/></g>}
    {type === "suspension" && <g {...common}><path d="M12 8h24M12 40h24M24 8v5l-7 4 14 6-14 6 14 6-7 5v0"/><path d="M10 8v6M38 8v6M10 34v6M38 34v6"/></g>}
    {type === "reliability" && <g {...common}><path d="M24 5 39 11v11c0 10-6 16-15 21C15 38 9 32 9 22V11Z"/><path d="m16 24 5 5 11-12"/></g>}
    {type !== "aero" && type !== "power" && type !== "suspension" && type !== "reliability" && <g {...common}><ellipse cx="24" cy="13" rx="13" ry="5"/><path d="M11 13v7c0 3 6 5 13 5s13-2 13-5v-7M11 20v7c0 3 6 5 13 5 2 0 4-.2 6-.6M11 27v7c0 3 6 5 13 5 2 0 4-.2 6-.6"/><path d="m31 29 4 4 7-8"/></g>}
  </svg>;
}

function StartScreenCarGraphic({ primary, secondary }: { primary: string; secondary: string }) {
  return <div className="start-car-art" aria-hidden="true" style={{ "--car-primary": primary, "--car-secondary": secondary } as React.CSSProperties}>
    <div className="start-car-art-glow" />
    <div className="start-car-art-label start-car-label-top"><span>R-01</span> OPEN-WHEEL CHASSIS <i /> TECHNICAL PROFILE</div>
    <svg viewBox="0 0 720 470" role="presentation" focusable="false">
      <defs>
        <linearGradient id="start-car-paint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="48%" stopColor={primary} />
          <stop offset="100%" stopColor="#151820" />
        </linearGradient>
        <linearGradient id="start-car-carbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#414753" />
          <stop offset="100%" stopColor="#101218" />
        </linearGradient>
        <linearGradient id="start-car-tyre" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#363a42" />
          <stop offset="55%" stopColor="#090a0e" />
          <stop offset="100%" stopColor="#20232a" />
        </linearGradient>
        <filter id="start-car-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
      </defs>
      <g className="start-car-blueprint" fill="none" stroke="#9ba5b7">
        <ellipse cx="360" cy="235" rx="280" ry="190" strokeOpacity=".13" strokeDasharray="3 8" />
        <ellipse cx="360" cy="235" rx="235" ry="157" strokeOpacity=".08" />
        <path d="M60 235H660 M360 20V450" strokeOpacity=".13" strokeDasharray="4 8" />
        <path d="M85 90h90M85 90v48M635 90h-90M635 90v48M85 380h90M85 380v-48M635 380h-90M635 380v-48" strokeOpacity=".32" />
      </g>
      <g transform="translate(0 4)">
        <path d="M360 54 C343 68 335 94 329 122 L314 171 L291 196 L282 236 L292 279 L316 304 L333 345 L343 375 L350 390 L370 390 L377 375 L387 345 L404 304 L428 279 L438 236 L429 196 L406 171 L391 122 C385 94 377 68 360 54Z" fill={primary} opacity=".13" filter="url(#start-car-shadow)" />
        {/* Front wing and endplates: the broad, unmistakable Formula-car nose. */}
        <path d="M285 103 L327 111 L343 123 L360 128 L377 123 L393 111 L435 103 L445 117 L413 135 L389 142 L331 142 L307 135 L275 117Z" fill="url(#start-car-carbon)" stroke="#747b89" strokeWidth="1.4" />
        <path d="M275 117 L306 126 L329 132 L391 132 L414 126 L445 117 L438 135 L407 146 L389 149 L331 149 L313 146 L282 135Z" fill={primary} stroke={secondary} strokeOpacity=".7" strokeWidth="1.1" />
        <path d="M291 118 L312 124 L312 141 L285 133Z M429 118 L408 124 L408 141 L435 133Z" fill={secondary} opacity=".9" />
        {/* Exposed front tyres, separate from the narrow central nose. */}
        <g stroke="#515762" strokeWidth="2">
          <path d="M264 137 Q262 127 273 124 L298 126 Q306 132 306 146 L303 175 Q299 184 286 181 L268 174 Q261 166 264 137Z" fill="url(#start-car-tyre)" />
          <path d="M456 137 Q458 127 447 124 L422 126 Q414 132 414 146 L417 175 Q421 184 434 181 L452 174 Q459 166 456 137Z" fill="url(#start-car-tyre)" />
        </g>
        <g stroke="#858c98" strokeWidth="1.2" opacity=".75">
          <path d="M274 139l22 6M273 149l24 6M274 159l22 6M446 139l-22 6M447 149l-24 6M446 159l-22 6" />
        </g>
        {/* Front suspension wishbones. */}
        <g fill="none" stroke="#c4c9d2" strokeWidth="2" strokeLinecap="round">
          <path d="M292 163L331 181L347 190M428 163L389 181L373 190" />
          <path d="M300 174L333 185M420 174L387 185" stroke="#777e8a" />
        </g>
        {/* Slim pointed nose, driver cell, halo and sidepods. */}
        <path d="M343 133 L377 133 L385 169 L379 218 L374 258 L366 291 L354 291 L346 258 L341 218 L335 169Z" fill="url(#start-car-paint)" stroke={secondary} strokeOpacity=".65" strokeWidth="1.2" />
        <path d="M350 142L370 142L371 196L366 231L354 231L349 196Z" fill={secondary} opacity=".86" />
        <path d="M351 155L369 155L367 191L353 191Z" fill="#121923" />
        <path d="M342 174L330 188L337 202L350 208M378 174L390 188L383 202L370 208" fill="none" stroke="#d6dbe4" strokeWidth="3" strokeLinecap="round" />
        <path d="M350 201 Q360 190 370 201 L376 224 L371 245 L349 245 L344 224Z" fill="#0a0d12" stroke="#727b8a" strokeWidth="1.2" />
        <path d="M350 208 Q360 201 370 208 L369 222 L351 222Z" fill="#252c38" />
        <path d="M341 231 L326 243 L318 267 L334 283 L347 266Z M379 231 L394 243 L402 267 L386 283 L373 266Z" fill="url(#start-car-paint)" stroke={secondary} strokeOpacity=".45" strokeWidth="1" />
        <path d="M318 256L338 264L342 277L328 290L309 279Z M402 256L382 264L378 277L392 290L411 279Z" fill={primary} />
        {/* Rear tyres: wider and set back, framing the rear bodywork. */}
        <g stroke="#515762" strokeWidth="2">
          <path d="M260 284 Q259 273 270 269 L296 270 Q306 276 306 291 L303 324 Q300 335 286 331 L268 324 Q260 316 260 284Z" fill="url(#start-car-tyre)" />
          <path d="M460 284 Q461 273 450 269 L424 270 Q414 276 414 291 L417 324 Q420 335 434 331 L452 324 Q460 316 460 284Z" fill="url(#start-car-tyre)" />
        </g>
        <g stroke="#858c98" strokeWidth="1.2" opacity=".75">
          <path d="M270 284l25 6M269 295l26 6M270 306l24 6M450 284l-25 6M451 295l-26 6M450 306l-24 6" />
        </g>
        {/* Engine cover and sculpted rear body. */}
        <path d="M347 263 L373 263 L389 289 L389 316 L378 345 L369 364 L351 364 L342 345 L331 316 L331 289Z" fill="url(#start-car-paint)" stroke={secondary} strokeOpacity=".65" strokeWidth="1.2" />
        <path d="M351 273L369 273L377 307L369 335L351 335L343 307Z" fill={secondary} opacity=".9" />
        <path d="M355 278H365L368 308L364 327H356L352 308Z" fill="#151a23" />
        <path d="M331 292L309 287L300 301L313 322L335 319M389 292L411 287L420 301L407 322L385 319" fill="#222731" stroke="#7c8491" strokeWidth="1.2" />
        <path d="M336 321L351 338L369 338L384 321L379 347L369 366L351 366L341 347Z" fill={primary} />
        {/* Rear wing, pylons and endplates. */}
        <path d="M282 365L324 357L343 363L377 363L396 357L438 365L446 386L400 394L377 388L343 388L320 394L274 386Z" fill="url(#start-car-carbon)" stroke="#7a818e" strokeWidth="1.3" />
        <path d="M274 386L320 382L343 377L377 377L400 382L446 386L439 399L397 403L377 397L343 397L323 403L281 399Z" fill={primary} stroke={secondary} strokeOpacity=".7" strokeWidth="1.1" />
        <path d="M292 369L320 367L320 385L285 390Z M428 369L400 367L400 385L435 390Z" fill={secondary} opacity=".9" />
        <path d="M345 360L345 380M375 360L375 380" stroke="#9da4b1" strokeWidth="3" />
        <path d="M345 371H375" stroke="#fff" strokeOpacity=".65" strokeWidth="1.2" />
      </g>
      <g className="start-car-callouts" fill="none" stroke="#aeb6c5" strokeOpacity=".6" strokeWidth="1">
        <path d="M285 142H185L157 118H105" /><path d="M391 211H486L512 187H590" /><path d="M407 377H492L516 399H595" />
      </g>
      <g fill="#c7ccd5" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="1.4">
        <text x="101" y="111" textAnchor="end">FRONT WING</text>
        <text x="594" y="180">HALO / COCKPIT</text>
        <text x="600" y="411">REAR WING</text>
      </g>
      <text x="360" y="446" textAnchor="middle" fill="#7f8795" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="3">OPEN-WHEEL AERODYNAMIC PLATFORM · R-01</text>
    </svg>
    <div className="start-car-art-label start-car-label-bottom"><span>TECHNICAL DRAWING / 001</span><b>22 CARS · 20 ROUNDS</b></div>
  </div>;
}

function PitWallGraphic() {
  return <div className="hero-art pitwall-art" aria-hidden="true">
    <div className="hero-art-glow" />
    <svg viewBox="0 0 760 250" role="presentation" focusable="false">
      <defs>
        <linearGradient id="pitwall-room" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#252a33"/><stop offset="100%" stopColor="#11141a"/>
        </linearGradient>
        <linearGradient id="pitwall-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d3440"/><stop offset="100%" stopColor="#101a24"/>
        </linearGradient>
        <linearGradient id="pitwall-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d2731" stopOpacity=".28"/><stop offset="100%" stopColor="#090c12" stopOpacity=".88"/>
        </linearGradient>
        <filter id="pitwall-soft-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      {/* Pitbox glass wall and overhead structure */}
      <path d="M22 26H738V181H22Z" fill="url(#pitwall-room)" stroke="#59616d" strokeOpacity=".7"/>
      <path d="M22 26H738V43H22Z" fill="#303742"/>
      <path d="M35 31H725M35 38H725" stroke="#79818d" strokeOpacity=".35"/>
      <path d="M30 48H730V176H30Z" fill="url(#pitwall-glass)" stroke="#4a5665" strokeOpacity=".6"/>
      <path d="M270 48V176M515 48V176" stroke="#687381" strokeOpacity=".38" strokeWidth="2"/>
      <path d="M39 53L205 53L170 170H39Z M283 53H501L485 170H283Z M528 53H720V170H548Z" fill="#a5b8c9" opacity=".025"/>
      {/* Wall-mounted telemetry displays */}
      <g stroke="#667381" strokeWidth="1.2">
        <rect x="47" y="60" width="130" height="63" rx="2" fill="#0a1018"/>
        <rect x="190" y="60" width="65" height="63" rx="2" fill="#0a1018"/>
        <rect x="288" y="60" width="115" height="63" rx="2" fill="#0a1018"/>
        <rect x="415" y="60" width="82" height="63" rx="2" fill="#0a1018"/>
        <rect x="535" y="60" width="82" height="63" rx="2" fill="#0a1018"/>
        <rect x="628" y="60" width="82" height="63" rx="2" fill="#0a1018"/>
      </g>
      <g fill="#aeb9c8" fontFamily="monospace" fontSize="6" letterSpacing=".8">
        <text x="55" y="70">LIVE TELEMETRY</text><text x="198" y="70">TYRE STATUS</text>
        <text x="296" y="70">CAR 01 · DATA</text><text x="423" y="70">SECTOR TIMES</text>
        <text x="543" y="70">STRATEGY</text><text x="636" y="70">WEATHER</text>
      </g>
      <g fill="none" strokeWidth="1.6">
        <path d="M55 107L68 100L80 104L94 86L107 95L122 88L137 96L151 81L167 88" stroke="#5cb9e8"/>
        <path d="M55 114L76 111L90 116L106 105L124 109L145 101L167 106" stroke="#d5a84f"/>
        <path d="M297 105L312 98L325 103L341 84L354 91L370 80L394 91" stroke="#65c9a2"/>
        <path d="M424 92H488M424 101H476M424 110H482" stroke="#667b91"/>
        <path d="M544 86H603M544 96H590M544 106H600" stroke="#667b91"/>
      </g>
      <g fill="#e4b45c">
        <circle cx="203" cy="86" r="4"/><circle cx="218" cy="86" r="4" fill="#e5e7eb"/><circle cx="233" cy="86" r="4" fill="#e5e7eb"/>
      </g>
      <g fill="#66c89c"><rect x="544" y="113" width="15" height="3"/><rect x="563" y="113" width="15" height="3" opacity=".65"/><rect x="582" y="113" width="15" height="3" opacity=".35"/></g>
      <g fill="#d5a84f"><rect x="637" y="83" width="13" height="5"/><rect x="653" y="83" width="13" height="5"/><rect x="669" y="83" width="13" height="5" opacity=".5"/></g>
      <path d="M38 137H721V174H38Z" fill="#0b0e13" opacity=".65"/>
      <path d="M38 137H721" stroke="#ff352a" strokeOpacity=".6"/>
      {/* Pitwall desk and consoles */}
      <path d="M20 180L740 180L760 210L0 210Z" fill="#252b34" stroke="#59616d"/>
      <path d="M20 181H740" stroke="#ff352a" strokeWidth="2" opacity=".8"/>
      <path d="M0 211H760V228H0Z" fill="#11141a"/>
      <g stroke="#697382" strokeWidth="1">
        <path d="M45 188H180L194 204H32Z" fill="#080b10"/>
        <path d="M213 188H345L358 204H200Z" fill="#080b10"/>
        <path d="M384 188H510L523 204H370Z" fill="#080b10"/>
        <path d="M549 188H688L704 204H535Z" fill="#080b10"/>
      </g>
      <g fill="#5db8e6">
        <rect x="53" y="192" width="5" height="3"/><rect x="63" y="192" width="5" height="3"/><rect x="73" y="192" width="5" height="3"/>
        <rect x="221" y="192" width="5" height="3"/><rect x="231" y="192" width="5" height="3"/><rect x="241" y="192" width="5" height="3"/>
        <rect x="393" y="192" width="5" height="3"/><rect x="403" y="192" width="5" height="3"/><rect x="413" y="192" width="5" height="3"/>
      </g>
      <g fill="#d6d9df" opacity=".9">
        {/* Engineers viewed from behind */}
        <path d="M80 161Q81 147 94 147Q107 147 108 161L113 181H75Z" fill="#3b4553"/>
        <circle cx="94" cy="143" r="10" fill="#171c24" stroke="#727d8b"/>
        <path d="M288 161Q289 147 302 147Q315 147 316 161L322 181H282Z" fill="#3b4553"/>
        <circle cx="302" cy="143" r="10" fill="#171c24" stroke="#727d8b"/>
        <path d="M463 161Q464 147 477 147Q490 147 491 161L497 181H457Z" fill="#3b4553"/>
        <circle cx="477" cy="143" r="10" fill="#171c24" stroke="#727d8b"/>
        <path d="M645 161Q646 147 659 147Q672 147 673 161L679 181H639Z" fill="#3b4553"/>
        <circle cx="659" cy="143" r="10" fill="#171c24" stroke="#727d8b"/>
      </g>
      <g fill="none" stroke="#aab3c1" strokeOpacity=".4" strokeWidth="1">
        <path d="M94 154L88 166M302 154L296 166M477 154L471 166M659 154L653 166"/>
      </g>
      {/* Ambient pit-lane light and engineering-room framing */}
      <path d="M22 26H738" stroke="#ff352a" strokeWidth="2" opacity=".75"/>
      <path d="M26 229H734" stroke="#7a8493" strokeOpacity=".35"/>
      <text x="28" y="244" fill="#8c96a5" fontFamily="monospace" fontSize="7" letterSpacing="2">REDLINE RACE OPERATIONS · PIT WALL</text>
      <text x="731" y="244" textAnchor="end" fill="#c5cad2" fontFamily="monospace" fontSize="7" letterSpacing="1.5">LIVE DATA / 01</text>
    </svg>
    <div className="hero-art-caption"><span>LIVE</span><i /> PIT WALL OPERATIONS <b>RACE CONTROL</b></div>
  </div>;
}

function DriverStrategy({ car, status, teamName, advice, onApplyAdvice, onPace, onTyre, onPitLap }: {
  car: CarState; status: RaceState["status"]; teamName: string; advice: StrategyAdvice | null; onApplyAdvice: () => void; onPace: (pace: Pace) => void; onTyre: (tyre: Tyre) => void; onPitLap: (lap: number) => void;
}) {
  const disabled = status === "finished" || status === "gameover";
  return <div className="driver-strategy">
    <div className="driver-head"><span className="driver-number">{car.id === "rp-1" ? "07" : "22"}</span><div className="driver-ident"><strong>{car.driver}</strong><span>{teamName.toUpperCase()} · {car.id === "rp-1" ? "CAR 01" : "CAR 02"}</span></div><span className={"tyre-pill tyre-" + car.tyre.toLowerCase()}>{car.tyre[0]}</span></div>
    <div className="driver-metrics">
      <div><span>TYRE LIFE</span><strong>{pct((1 - car.tyreWear) * 100)}</strong><div className="meter"><i style={{ width: pct((1 - car.tyreWear) * 100) }}/></div></div>
      <div><span>FUEL LOAD</span><strong>{pct(car.fuel)}</strong><div className="meter fuel"><i style={{ width: pct(car.fuel) }}/></div></div>
    </div>
    {advice && <div className="strategy-advice">
      <div className="strategy-advice-copy"><span>LIVE ENGINEER CALL</span><strong>{advice.headline}</strong><p>{advice.reason}</p></div>
      <button type="button" disabled={disabled} onClick={onApplyAdvice}>{advice.actionLabel} <span>↗</span></button>
    </div>}
    <div className="strategy-label">PACE MODE · SPEED VS TYRE/FUEL COST</div>
    <div className="segmented">{(["CONSERVE", "BALANCED", "PUSH"] as Pace[]).map((pace) => <button key={pace} disabled={disabled} className={car.pace === pace ? "selected" : ""} onClick={() => onPace(pace)}>{pace}</button>)}</div>
    <div className="strategy-row">
      <label>Next tyre<select disabled={disabled} value={car.nextTyre} onChange={(e) => onTyre(e.target.value as Tyre)}><option value="SOFT">Soft</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
      <label>Pit target<select disabled={disabled} value={car.pitLap} onChange={(e) => onPitLap(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 3).map((lap) => <option key={lap} value={lap}>Lap {lap}</option>)}</select></label>
    </div>
  </div>;
}

export default function App() {
  const [race, setRace] = useState<RaceState>(() => loadRace());
  const [hasSavedCareer] = useState(() => { try { return Boolean(localStorage.getItem(SAVE_KEY)); } catch { return false; } });
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showInitialDraft, setShowInitialDraft] = useState(false);
  const [showIntermission, setShowIntermission] = useState(() => { try { return loadRace().status === "finished"; } catch { return false; } });
  const [intermissionUpgradeInstalled, setIntermissionUpgradeInstalled] = useState(false);
  useEffect(() => {
    if (!showStartScreen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
    };
  }, [showStartScreen]);
  const [teamNameDraft, setTeamNameDraft] = useState(() => { try { const raw = localStorage.getItem(SAVE_KEY); const saved = raw ? JSON.parse(raw) as RaceState : null; return saved?.playerTeamName ?? saved?.cars?.find((car) => car.playerCar)?.team ?? "Redline GP"; } catch { return "Redline GP"; } });
  const [principalNameDraft, setPrincipalNameDraft] = useState(() => { try { const raw = localStorage.getItem(SAVE_KEY); const saved = raw ? JSON.parse(raw) as RaceState : null; return saved?.playerPrincipalName ?? "Team Principal"; } catch { return "Team Principal"; } });
  const [teamPrimaryColor, setTeamPrimaryColor] = useState(() => { try { const raw = localStorage.getItem(SAVE_KEY); const saved = raw ? JSON.parse(raw) as RaceState : null; return saved?.playerTeamColor ?? saved?.cars?.find((car) => car.playerCar)?.teamColor ?? "#f04438"; } catch { return "#f04438"; } });
  const [teamSecondaryColor, setTeamSecondaryColor] = useState(() => { try { const raw = localStorage.getItem(SAVE_KEY); const saved = raw ? JSON.parse(raw) as RaceState : null; return saved?.playerTeamSecondaryColor ?? "#f2f2f2"; } catch { return "#f2f2f2"; } });

  const [selectedDriverOne, setSelectedDriverOne] = useState("Luca Moretti");
  const [selectedDriverTwo, setSelectedDriverTwo] = useState("Emil Novak");
  const [bestRun, setBestRun] = useState<BestRun | null>(() => { try { const raw = localStorage.getItem(BEST_RUN_KEY); return raw ? JSON.parse(raw) as BestRun : null; } catch { return null; } });
  const [garageMeta, setGarageMeta] = useState<GarageMeta>(() => loadGarageMeta());
  const [speed, setSpeed] = useState(1);
  const [savedAt, setSavedAt] = useState("LOCAL SAVE READY");
  const [showResults, setShowResults] = useState(false);
  const [showSaveTransfer, setShowSaveTransfer] = useState(false);
  const [saveCode, setSaveCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [saveTransferMessage, setSaveTransferMessage] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const playerTeamName = race.playerTeamName ?? race.cars.find((car) => car.playerCar)?.team ?? "Redline GP";
  const redlinePoints = race.teamPoints?.[playerTeamName] ?? 0;
  const teamRankings = Object.entries(race.teamPoints ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const redlineRank = teamRankings.findIndex(([team]) => team === playerTeamName) + 1;
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(race)); setSavedAt("SAVED LOCALLY · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); }
    catch { setSavedAt("LOCAL STORAGE UNAVAILABLE"); }
  }, [race]);
  useEffect(() => {
    try { localStorage.setItem(GARAGE_META_KEY, JSON.stringify(garageMeta)); } catch { /* Optional persistent storage. */ }
  }, [garageMeta]);
  useEffect(() => {
    if (race.status === "finished" && !showInitialDraft) setShowIntermission(true);
    if (race.status !== "finished") { setShowIntermission(false); setIntermissionUpgradeInstalled(false); }
  }, [race.status, showInitialDraft]);
  useEffect(() => {
    if (race.status !== "finished" && race.status !== "gameover") return;
    const runId = race.seed + ":" + race.weekendNumber;
    if (garageMeta.rewardedRuns.includes(runId)) return;
    const playerPosition = standings(race).findIndex((car) => car.playerCar) + 1;
    const earned = 1 + (playerPosition > 0 && playerPosition <= 3 ? 1 : 0);
    setGarageMeta((current) => current.rewardedRuns.includes(runId) ? current : { ...current, research: current.research + earned, rewardedRuns: [...current.rewardedRuns, runId].slice(-500) });
  }, [race.status, race.seed, race.weekendNumber, race.cars, garageMeta.rewardedRuns]);
  useEffect(() => {
    if (race.status !== "running") return;
    const id = window.setInterval(() => setRace((current) => stepRace(current)), Math.max(120, 1000 / speed));
    return () => window.clearInterval(id);
  }, [race.status, speed]);
  useEffect(() => {
    if (race.status !== "gameover") return;
    const result: BestRun = { points: race.teamPoints?.[playerTeamName] ?? 0, position: redlineRank || 11, seed: race.seed };
    if (!bestRun || result.points > bestRun.points || (result.points === bestRun.points && result.position < bestRun.position)) {
      setBestRun(result);
      try { localStorage.setItem(BEST_RUN_KEY, JSON.stringify(result)); } catch { /* Best-run records are optional if storage is full. */ }
    }
  }, [race.status, race.teamPoints, race.seed, redlineRank, bestRun]);
  const order = useMemo(() => standings(race), [race]);
  const finishedCount = race.cars.filter((car) => car.finished).length;
  const modules = race.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 };
  const isInitialDraft = showInitialDraft;
  const draftCards = useMemo(() => race.status === "finished" || isInitialDraft ? draftUpgradeCards(race) : [], [race.status, race.seed, race.weekendNumber, isInitialDraft]);
  const selectedDraft = draftCards.find((card) => card.id === selectedDraftId) ?? draftCards[0];
  const setStrategy = (car: CarState, patch: Partial<Pick<CarState, "pace" | "nextTyre" | "pitLap">>) => setRace((current) => setDriverStrategy(current, car.id, patch));
  const createMetaCareer = (seed: number, name: string, principal: string, driverOne: string, driverTwo: string, primary = teamPrimaryColor, secondary = teamSecondaryColor) => {
    const fresh = createRace(seed, 0, 2500000, 1, name, driverOne, driverTwo, principal);
    fresh.playerTeamColor = primary;
    fresh.playerTeamSecondaryColor = secondary;
    fresh.cars = fresh.cars.map((car) => car.playerCar ? { ...car, teamColor: primary } : car);
    if (garageMeta.unlocks.includes("aero-blueprint")) fresh.upgradeModules.aero += 1;
    if (garageMeta.unlocks.includes("power-mapping")) fresh.upgradeModules.power += 1;
    if (garageMeta.unlocks.includes("sponsor-network")) fresh.cash += 500000;
    return fresh;
  };
  const startNextRace = () => {
    if (!intermissionUpgradeInstalled || race.status !== "finished") return;
    const playerCars = race.cars.filter((car) => car.playerCar);
    const next = createRace((race.seed + 2654435761 + race.weekendNumber * 97) >>> 0, race.upgradeLevel, race.cash, race.weekendNumber + 1, playerTeamName, playerCars[0]?.driver ?? "Alex Mercer", playerCars[1]?.driver ?? "Mika Tanaka", race.playerPrincipalName ?? "Team Principal");
    next.playerTeamColor = race.playerTeamColor ?? playerCars[0]?.teamColor ?? teamPrimaryColor;
    next.playerTeamSecondaryColor = race.playerTeamSecondaryColor ?? teamSecondaryColor;
    next.cars = next.cars.map((car) => car.playerCar ? { ...car, teamColor: next.playerTeamColor! } : car);
    next.upgradeModules = { ...(race.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 }) };
    next.installedUpgrades = [...(race.installedUpgrades ?? [])];
    next.teamPoints = { ...(race.teamPoints ?? {}) };
    setRace(next);
    setShowIntermission(false);
    setIntermissionUpgradeInstalled(false);
    setShowResults(false);
    setSelectedDraftId("");
  };
  const buyGaragePerk = (id: string, cost: number) => {
    if (garageMeta.unlocks.includes(id) || garageMeta.research < cost) return;
    setGarageMeta((current) => current.unlocks.includes(id) || current.research < cost ? current : { ...current, research: current.research - cost, unlocks: [...current.unlocks, id] });
  };
  const resetCareer = () => { if (window.confirm("Start a new career? Your current local career will be replaced.")) { setRace(createMetaCareer(Date.now() >>> 0, playerTeamName, principalNameDraft, selectedDriverOne, selectedDriverTwo)); setShowResults(false); setSelectedDraftId(""); setShowInitialDraft(true); } };
  const startCustomCareer = () => { const name = teamNameDraft.trim().slice(0, 24); const principal = principalNameDraft.trim().slice(0, 32); if (!name || !principal || !selectedDriverOne || !selectedDriverTwo || selectedDriverOne === selectedDriverTwo) return; setRace(createMetaCareer(Date.now() >>> 0, name, principal, selectedDriverOne, selectedDriverTwo, teamPrimaryColor, teamSecondaryColor)); setTeamNameDraft(name); setPrincipalNameDraft(principal); setShowStartScreen(false); setShowInitialDraft(true); setShowResults(false); setSelectedDraftId(""); };

  const exportSaveCode = () => {
    try {
      const code = encodeSaveCode({ format: 1, exportedAt: new Date().toISOString(), race, garageMeta, bestRun });
      setSaveCode(code);
      setSaveTransferMessage("Save code generated. Keep a copy somewhere safe.");
    } catch { setSaveTransferMessage("Could not generate a save code. Try again after the game has saved."); }
  };
  const importSaveCode = () => {
    try {
      const payload = decodeSaveCode(importCode);
      if (!window.confirm("Import this career and replace the current career and Garage data on this device? This cannot be undone unless you have exported the current save.")) return;
      const restored = ensureFullGrid({ ...payload.race, upgradeModules: payload.race.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 } });
      setRace(restored);
      setGarageMeta({ research: Math.max(0, Number(payload.garageMeta.research) || 0), unlocks: payload.garageMeta.unlocks.filter((id: unknown): id is string => typeof id === "string"), rewardedRuns: payload.garageMeta.rewardedRuns.filter((id: unknown): id is string => typeof id === "string") });
      setBestRun(payload.bestRun && typeof payload.bestRun.points === "number" ? payload.bestRun as BestRun : null);
      setTeamNameDraft(restored.playerTeamName ?? restored.cars.find((car) => car.playerCar)?.team ?? "Redline GP");
      setPrincipalNameDraft(restored.playerPrincipalName ?? "Team Principal");
      const restoredPrimary = restored.playerTeamColor ?? restored.cars.find((car) => car.playerCar)?.teamColor ?? "#f04438";
      const restoredSecondary = restored.playerTeamSecondaryColor ?? "#f2f2f2";
      setTeamPrimaryColor(restoredPrimary);
      setTeamSecondaryColor(restoredSecondary);

      const playerCars = restored.cars.filter((car) => car.playerCar);
      if (playerCars[0]?.driver) setSelectedDriverOne(playerCars[0].driver);
      if (playerCars[1]?.driver) setSelectedDriverTwo(playerCars[1].driver);
      setShowStartScreen(false);
      setShowInitialDraft(false);
      setShowIntermission(restored.status === "finished");
      setIntermissionUpgradeInstalled(false);
      setShowResults(restored.status === "gameover");
      setSelectedDraftId("");
      setSaveTransferMessage("Career imported successfully. Local autosave is now updated.");
      setImportCode("");
    } catch (error) {
      setSaveTransferMessage(error instanceof Error ? error.message : "Could not import this save code.");
    }
  };
  const bestLap = Math.min(...race.cars.filter((car) => car.playerCar && car.bestLap > 0).map((car) => car.bestLap), Infinity);

  return <main className="app-shell">
    {showStartScreen && <div className="start-screen" role="dialog" aria-modal="true" aria-labelledby="start-screen-title"><div className="start-screen-grid"/><div className="start-screen-content"><div className="start-screen-brand"><svg className="brand-mark-svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="14" fill="#0B0B10"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="13.3" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.5"/><g transform="translate(6.8 0) skewX(-12)"><path fill="#F4F4F6" fillRule="evenodd" d="M16 14L38 14L48 19L50 26L50 29L47 35L41 38L24 38L24 50L16 50ZM24 21L36 21L42 24L42 28L36 31L24 31Z"/><path fill="#FF1E00" d="M30 38L40 38L51 50L40.5 50Z"/></g></svg><span className="start-brand-lockup"><b>REDLINE PADDOCK</b><small>RACE OPERATIONS SIMULATOR</small></span></div><div className="start-screen-kicker">YOUR TEAM. YOUR LEGACY.</div><h1 id="start-screen-title">Build your <em>paddock.</em></h1><p className="start-screen-intro">Every great racing story starts with a name. Create your team and take on a 20-round championship.</p><label className="team-name-label" htmlFor="team-name-input">TEAM NAME <span>{teamNameDraft.trim().length}/24</span></label><input id="team-name-input" className="team-name-input" value={teamNameDraft} maxLength={24} placeholder="Enter your team name" onChange={(event) => setTeamNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && teamNameDraft.trim()) document.getElementById("principal-name-input")?.focus(); }}/><label className="team-name-label principal-name-label" htmlFor="principal-name-input">TEAM PRINCIPAL <span>{principalNameDraft.trim().length}/32</span></label><input id="principal-name-input" className="team-name-input" value={principalNameDraft} maxLength={32} placeholder="Enter your team principal name" onChange={(event) => setPrincipalNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && principalNameDraft.trim()) document.getElementById("principal-name-input")?.blur(); }}/><section className="team-customization"><div className="team-customization-heading"><div><span className="market-eyebrow">TEAM IDENTITY</span><h2>Make the grid yours.</h2></div><span className="team-customization-note">PRIMARY + ACCENT</span></div><p>Choose your team's colours. They'll appear on your cars and race markers, and stay with your career save.</p><div className="team-color-controls"><label className="team-color-picker"><span>PRIMARY COLOUR</span><div><input type="color" aria-label="Choose primary team colour" value={teamPrimaryColor} onChange={(event) => setTeamPrimaryColor(event.target.value)} /><code>{teamPrimaryColor.toUpperCase()}</code></div></label><label className="team-color-picker"><span>SECONDARY COLOUR</span><div><input type="color" aria-label="Choose secondary team colour" value={teamSecondaryColor} onChange={(event) => setTeamSecondaryColor(event.target.value)} /><code>{teamSecondaryColor.toUpperCase()}</code></div></label></div><div className="team-color-presets" aria-label="Team colour presets">{TEAM_COLOR_PRESETS.map((preset) => <button type="button" key={preset.name} className={"team-color-preset" + (teamPrimaryColor.toLowerCase() === preset.primary && teamSecondaryColor.toLowerCase() === preset.secondary ? " active" : "")} onClick={() => { setTeamPrimaryColor(preset.primary); setTeamSecondaryColor(preset.secondary); }} aria-label={"Use " + preset.name + " team colours"} title={preset.name}><span style={{ background: "linear-gradient(135deg, " + preset.primary + " 0 55%, " + preset.secondary + " 55% 100%)" }} /><small>{preset.name}</small></button>)}</div></section><div className="start-screen-preview" style={{ "--team-primary": teamPrimaryColor, "--team-secondary": teamSecondaryColor } as React.CSSProperties}><span className="team-preview-swatch"/><div><small>YOUR CONSTRUCTOR</small><strong>{teamNameDraft.trim() || "YOUR TEAM NAME"}</strong><small className="principal-preview-label">TEAM PRINCIPAL</small><strong className="principal-preview-name">{principalNameDraft.trim() || "YOUR NAME"}</strong></div><span className="team-preview-number">07 / 22</span></div><section className="driver-market"><div className="driver-market-heading"><div><span className="market-eyebrow">DRIVER MARKET · PRE-SEASON</span><h2>Build your driver line-up.</h2></div><span className="market-seat-count">{selectedDriverOne && selectedDriverTwo ? "2 / 2 SEATS" : "SELECT 2 DRIVERS"}</span></div><p className="driver-market-copy">Choose two drivers before the season begins. Pace, racecraft, tyre management and consistency affect race performance; potential shows future upside.</p><div className="driver-market-seats"><div><small>SEAT 01</small><strong>{selectedDriverOne || "OPEN SEAT"}</strong></div><div><small>SEAT 02</small><strong>{selectedDriverTwo || "OPEN SEAT"}</strong></div></div><div className="driver-market-grid">{DRIVER_MARKET.map((driver) => { const seatOne = selectedDriverOne === driver.name; const seatTwo = selectedDriverTwo === driver.name; const overall = Math.round((driver.pace + driver.racecraft + driver.tyreManagement + driver.consistency) / 4); return <article className={"market-driver-card" + (seatOne || seatTwo ? " market-driver-selected" : "")} key={driver.id}><div className="market-driver-top"><span className="market-driver-number">#{String(DRIVER_MARKET.indexOf(driver) + 1).padStart(2, "0")}</span><span className="market-driver-overall">{overall}<small>OVR</small></span></div><div className="market-driver-identity"><DriverPortrait driver={driver} index={DRIVER_MARKET.indexOf(driver)} /><div className="market-driver-nameplate"><h3>{driver.name}</h3><span className="market-driver-role">{driver.role}</span></div></div><span className="market-driver-role">{driver.role}</span><div className="market-driver-stats">{[["PACE", driver.pace], ["RACECRAFT", driver.racecraft], ["TYRE MGMT", driver.tyreManagement], ["CONSISTENCY", driver.consistency], ["POTENTIAL", driver.potential]].map(([label, value]) => <div className="market-stat" key={label as string}><span>{label}</span><div><i style={{ width: (value as number) + "%" }}/></div><b>{value}</b></div>)}</div><div className="market-driver-actions"><button type="button" className={seatOne ? "selected-seat" : ""} disabled={seatTwo} onClick={() => setSelectedDriverOne(driver.name)}>{seatOne ? "✓ SEAT 01" : "SELECT · 01"}</button><button type="button" className={seatTwo ? "selected-seat" : ""} disabled={seatOne} onClick={() => setSelectedDriverTwo(driver.name)}>{seatTwo ? "✓ SEAT 02" : "SELECT · 02"}</button></div></article>; })}</div></section><button className="primary-button start-career-button" disabled={!teamNameDraft.trim() || !principalNameDraft.trim() || !selectedDriverOne || !selectedDriverTwo || selectedDriverOne === selectedDriverTwo} onClick={startCustomCareer}>CREATE TEAM & START SEASON <span>↗</span></button>{hasSavedCareer && <button className="continue-career-button" onClick={() => { setShowStartScreen(false); setShowInitialDraft(race.status === "ready" && race.upgradeLevel === 0 && race.weekendNumber === 1); }}>CONTINUE EXISTING CAREER <span>→</span></button>}<button className="start-save-transfer" onClick={() => { setShowSaveTransfer(true); setSaveTransferMessage(""); }}>IMPORT A SAVE CODE / TRANSFER CAREER ↗</button><p className="start-screen-footnote">20 ROUNDS · 22 DRIVERS · SINGLE-PLAYER MANAGEMENT</p></div><div className="start-screen-visual"><StartScreenCarGraphic primary={teamPrimaryColor} secondary={teamSecondaryColor}/><div className="start-visual-caption"><span>01</span> CHASSIS R-01 <i/> RACE ENGINEERING DIVISION</div></div></div>}
    {isInitialDraft && <div className="initial-upgrade-screen" role="dialog" aria-modal="true" aria-labelledby="initial-upgrade-title">
      <div className="initial-upgrade-topline"><span>REDLINE PADDOCK <i/> PRE-SEASON DEVELOPMENT</span><span>ROUND 01 / 20</span></div>
      <div className="initial-upgrade-content">
        <div className="initial-upgrade-kicker">YOUR RUN STARTS HERE · DEVELOPMENT PICK 01</div>
        <h1 id="initial-upgrade-title">Define your <em>advantage.</em></h1>
        <p className="initial-upgrade-intro">Before the lights go out, your engineers have secured three development opportunities. Choose one permanent upgrade to shape your run. Every pick has a trade-off, and your build will evolve from here.</p>
        <div className="rogue-draft-grid initial-rogue-grid">
          {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => setSelectedDraftId(card.id)}>
            <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
            <span className="rogue-card-art"><UpgradeIcon type={card.upgradeType}/></span>
            <span className="rogue-card-subtitle">{card.subtitle}</span>
            <strong>{card.title}</strong><p>{card.description}</p>
            <span className="rogue-card-effect">{card.effect}</span>
            <span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
          </button>)}
        </div>
        <div className="initial-upgrade-footer"><span>YOUR FIRST PICK IS PERMANENT · 19 MORE DEVELOPMENT PICKS AVAILABLE</span><button className="primary-button" disabled={!selectedDraft} onClick={() => { if (!selectedDraft) return; setRace((current) => applyStartingUpgrade(current, selectedDraft.id)); setShowInitialDraft(false); setSelectedDraftId(""); }}>INSTALL STARTING UPGRADE ↗</button></div>
      </div>
    </div>}
    {showIntermission && race.status === "finished" && <div className="career-intermission-screen" role="dialog" aria-modal="true" aria-labelledby="intermission-title">
      <div className="career-intermission-topline"><span>REDLINE PADDOCK <i/> BETWEEN RACES</span><span>ROUND {String(race.weekendNumber).padStart(2, "0")} COMPLETE</span></div>
      <div className="career-intermission-content">
        <div className="section-kicker">ENGINEERING DEPARTMENT · POST-RACE DEVELOPMENT</div>
        <h1 id="intermission-title">Build your <em>next advantage.</em></h1>
        <p className="career-intermission-intro">Review the weekend, choose one upgrade for this career, then visit the garage before heading to the next circuit.</p>
        <div className="intermission-summary"><span>TEAM BUDGET <b>{money(race.cash)}</b></span><span>DEVELOPMENT PICKS <b>{race.upgradeLevel}</b></span><span>RESEARCH BANK <b>✦ {garageMeta.research} RP</b></span></div>
        <div className="intermission-section-heading"><div><span>STEP 01</span><h2>Choose your next upgrade</h2></div><small>ONE PICK · THIS CAREER</small></div>
        <div className="rogue-draft-grid intermission-upgrade-grid">
          {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => { setSelectedDraftId(card.id); setIntermissionUpgradeInstalled(false); }}>
            <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
            <span className="rogue-card-art"><UpgradeIcon type={card.upgradeType}/></span><span className="rogue-card-subtitle">{card.subtitle}</span><strong>{card.title}</strong><p>{card.description}</p><span className="rogue-card-effect">{card.effect}</span><span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
          </button>)}
        </div>
        <div className="intermission-action-row">
          <div><span className="section-kicker">SELECTED DEVELOPMENT</span><strong>{selectedDraft?.title ?? "Choose one offer above"}</strong><p>{intermissionUpgradeInstalled ? "Upgrade installed. You can now continue to the garage and next race." : "Lock in your choice before moving to the garage."}</p></div>
          <button className="primary-button" disabled={!selectedDraft || intermissionUpgradeInstalled} onClick={() => { if (!selectedDraft) return; setRace((current) => upgradeCar(current, selectedDraft.id)); setIntermissionUpgradeInstalled(true); setShowResults(false); }}> {intermissionUpgradeInstalled ? "UPGRADE INSTALLED ✓" : "INSTALL UPGRADE ↗"}</button>
        </div>
        <div className="intermission-section-heading garage-intermission-heading"><div><span>STEP 02</span><h2>Development garage</h2></div><span className="research-counter">✦ {garageMeta.research} RESEARCH</span></div>
        <p className="garage-progression-intro">Spend research on permanent blueprints that carry into future careers. Completed races earn 1 RP, with a podium bonus of 1 RP.</p>
        <div className="garage-perk-grid">
          {GARAGE_PERKS.map((perk) => { const owned = garageMeta.unlocks.includes(perk.id); const affordable = garageMeta.research >= perk.cost; return <article className={"garage-perk-card" + (owned ? " garage-perk-owned" : "")} key={perk.id}>
            <div className="garage-perk-top"><span>{perk.category}</span><b>{owned ? "UNLOCKED" : perk.cost + " RP"}</b></div><h3>{perk.title}</h3><p>{perk.description}</p>
            <button className={owned ? "garage-perk-button owned" : "garage-perk-button"} disabled={owned || !affordable} onClick={() => buyGaragePerk(perk.id, perk.cost)}>{owned ? "✓ PERMANENT BLUEPRINT" : affordable ? "UNLOCK BLUEPRINT ↗" : "NEED " + (perk.cost - garageMeta.research) + " MORE RP"}</button>
          </article>; })}
        </div>
        <div className="intermission-bottom-row"><span>PERMANENT BLUEPRINTS: {garageMeta.unlocks.length}/{GARAGE_PERKS.length} · SAVED LOCALLY</span><button className="primary-button" disabled={!intermissionUpgradeInstalled} onClick={startNextRace}>NEXT RACE ↗</button></div>
      </div>
    </div>}
    <header className="topbar"><a className="brand" href="#" aria-label="Redline Paddock home"><svg className="brand-mark-svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="14" fill="#0B0B10"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="13.3" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.5"/><g transform="translate(6.8 0) skewX(-12)"><path fill="#F4F4F6" fillRule="evenodd" d="M16 14L38 14L48 19L50 26L50 29L47 35L41 38L24 38L24 50L16 50ZM24 21L36 21L42 24L42 28L36 31L24 31Z"/><path fill="#FF1E00" d="M30 38L40 38L51 50L40.5 50Z"/></g></svg><span className="brand-text"><b>REDLINE PADDOCK</b><span>RACE OPERATIONS SIMULATOR</span></span></a><nav className="main-nav"><span className="nav-active">OPERATIONS</span><span>ENGINEERING</span><span>CHAMPIONSHIP</span></nav><div className="top-status"><i className="status-dot"/> PROTOTYPE <b/> {savedAt}<button className="save-transfer-trigger" onClick={() => { setShowSaveTransfer(true); setSaveTransferMessage(""); }}>SAVE / TRANSFER</button></div></header>
    <section className="page-heading"><div className="heading-copy"><div className="eyebrow">TEAM PRINCIPAL: {race.playerPrincipalName ?? "Team Principal"} <b>/</b> TEAM OPERATIONS <b>/</b> ROUND {String(Math.min(race.weekendNumber, CAMPAIGN_LENGTH)).padStart(2, "0")} / {CAMPAIGN_LENGTH}</div><h1>Race <em>Control.</em></h1><p>Every decision has a cost. Every lap is an opportunity.</p></div><PitWallGraphic /><div className="weekend-status"><i className={"live-indicator " + (race.status === "running" ? "is-live" : "")}/><div><strong>{race.status === "running" ? "SESSION LIVE" : race.status === "finished" || race.status === "gameover" ? "SESSION COMPLETE" : race.status === "paused" ? "SESSION PAUSED" : "RACE WEEKEND"}</strong><span>{(race.circuitName ?? "Copperhead Ring").toUpperCase()} · GENERATED CIRCUIT</span></div></div></section>
    <section className="stat-strip">
      <div className="stat-cell"><span>TEAM BUDGET</span><strong>{money(race.cash)}</strong><small>{race.upgradeLevel ? "PACKAGE LEVEL " + race.upgradeLevel : "INITIAL ALLOCATION"}</small></div>
      <div className="stat-cell"><span>CAR PERFORMANCE</span><strong>{Math.min(100, 82 + modules.aero * 2 + modules.power * 3 + modules.suspension + modules.reliability)}<small className="inline-unit"> / 100</small></strong><small>{race.upgradeLevel ? "DRAFTED SPEC" : "BASELINE SPEC"}</small></div>
      <div className="stat-cell"><span>RACE PROGRESS</span><strong>{Math.min(race.lap, race.totalLaps)}<small className="inline-unit"> / {race.totalLaps} LAPS</small></strong><small>{finishedCount}/22 CARS FINISHED</small></div>
      <div className="stat-cell"><span>YOUR BEST LAP</span><strong>{formatLapTime(bestLap)}</strong><small>SESSION TIMING</small></div>
    </section>
    <section className="panel current-upgrades-panel" aria-label="Current team upgrades">
      <div className="panel-heading"><div><div className="section-kicker">CAR DEVELOPMENT · CURRENT SPEC</div><h2>Installed upgrades</h2></div><span className="upgrade-count-badge">{(race.installedUpgrades ?? []).length} FITTED</span></div>
      <div className="upgrade-module-strip">
        {([{ key: "aero", label: "AERODYNAMICS", icon: "A" }, { key: "power", label: "POWER UNIT", icon: "P" }, { key: "suspension", label: "MECHANICAL GRIP", icon: "S" }, { key: "reliability", label: "RELIABILITY", icon: "R" }] as const).map((module) => <div className="upgrade-module-meter" key={module.key}><span className={"upgrade-module-icon module-" + module.key}>{module.icon}</span><div><small>{module.label}</small><strong>LEVEL {modules[module.key]}</strong><div className="upgrade-module-track"><i style={{ width: Math.min(100, modules[module.key] * 20) + "%" }} /></div></div></div>)}
      </div>
      {(race.installedUpgrades ?? []).length > 0 ? <div className="installed-upgrade-list">{[...(race.installedUpgrades ?? [])].reverse().map((upgrade, index) => <article className="installed-upgrade-item" key={upgrade.id + "-" + index}><span className={"installed-upgrade-icon " + (upgrade.upgradeType ? "type-" + upgrade.upgradeType : "type-commercial")}>{upgrade.upgradeType ? upgrade.upgradeType === "aero" ? "A" : upgrade.upgradeType === "power" ? "P" : upgrade.upgradeType === "suspension" ? "S" : "R" : "₥"}</span><div className="installed-upgrade-copy"><div><span>{upgrade.subtitle}</span><b className={"rarity-label rarity-text-" + upgrade.rarity.toLowerCase()}>{upgrade.rarity}</b></div><strong>{upgrade.title}</strong><small>{upgrade.effect}</small></div></article>)}</div> : <div className="upgrade-empty-state"><span>+</span><div><strong>No career upgrades installed yet</strong><p>Your selected development cards will be listed here after you fit your first upgrade. Permanent Garage blueprints are tracked separately.</p></div></div>}
      <div className="current-upgrades-foot"><span>CAREER BUILD · {race.upgradeLevel} DEVELOPMENT PICKS</span><span>{buildSynergies(modules).length} ACTIVE SYNERGIES</span></div>
    </section>
    {(race.status === "finished" || race.status === "gameover") && <><section className="build-intel" aria-label="Engineering build profile">
      <div className="build-intel-heading"><span>ENGINEERING PROFILE</span><b>{buildSynergies(modules).length === 1 ? "1 ACTIVE SYNERGY" : buildSynergies(modules).length + " ACTIVE SYNERGIES"}</b></div>
      <div className="build-intel-items">
        <div className="build-tradeoff"><strong>DEVELOPMENT TRADE-OFFS</strong><span>Aero increases tyre load · Power packages use more fuel</span></div>
        {buildSynergies(modules).length === 0 ? <div className="build-synergy-empty">No build synergy yet. Invest in two related departments to unlock a combined effect.</div> : buildSynergies(modules).map((synergy) => <div className="build-synergy" key={synergy}><strong>{synergy}</strong><span>{synergy === "AERO + POWER INTEGRATION" ? "Extra 0.10s pace per lap from a coordinated aero and power package." : "10% less tyre wear and component condition loss from an endurance-focused platform."}</span></div>)}
      </div>
    </section>
    <section className="panel garage-progression-panel">
      <div className="panel-heading"><div><div className="section-kicker">BETWEEN-RUN PROGRESSION</div><h2>Development garage</h2></div><span className="research-counter">✦ {garageMeta.research} RESEARCH</span></div>
      <p className="garage-progression-intro">Every completed Grand Prix earns 1 research point. Finish on the podium with either car to earn 1 bonus point. Spend research on permanent blueprints that carry into every new career.</p>
      <div className="garage-perk-grid">
        {GARAGE_PERKS.map((perk) => {
          const owned = garageMeta.unlocks.includes(perk.id);
          const affordable = garageMeta.research >= perk.cost;
          return <article className={"garage-perk-card" + (owned ? " garage-perk-owned" : "")} key={perk.id}>
            <div className="garage-perk-top"><span>{perk.category}</span><b>{owned ? "UNLOCKED" : perk.cost + " RP"}</b></div>
            <h3>{perk.title}</h3><p>{perk.description}</p>
            <button className={owned ? "garage-perk-button owned" : "garage-perk-button"} disabled={owned || !affordable} onClick={() => buyGaragePerk(perk.id, perk.cost)}>{owned ? "✓ PERMANENT BLUEPRINT" : affordable ? "UNLOCK BLUEPRINT ↗" : "NEED " + (perk.cost - garageMeta.research) + " MORE RP"}</button>
          </article>;
        })}
      </div>
      <div className="garage-progression-foot"><span>PERMANENT UNLOCKS: {garageMeta.unlocks.length}/{GARAGE_PERKS.length}</span><span>RESEARCH IS SAVED LOCALLY ACROSS CAREERS</span></div>
    </section></>}
    <div className="content-grid">
      <div className="content-column left-column">
      <section className="panel race-panel">
        <div className="panel-heading"><div><div className="section-kicker">LIVE TELEMETRY <i className="tiny-live"/></div><h2>Race overview</h2></div><div className="lap-badge">LAP <strong>{String(Math.min(race.lap, race.totalLaps)).padStart(2, "0")}</strong><span>/ {race.totalLaps}</span></div></div>
        <CircuitMap cars={race.cars} lap={race.lap} teamName={playerTeamName} circuitSeed={race.circuitSeed ?? race.seed} circuitName={race.circuitName ?? "Copperhead Ring"}/>

        {(race.status === "finished" || race.status === "gameover") && <div className="finish-banner"><div><span className="section-kicker">CHEQUERED FLAG</span><h3>{race.status === "gameover" ? "Campaign complete." : "Race complete."}</h3><p>{race.status === "gameover" ? "Twenty rounds. Final points are locked." : "Prize income and classification are ready for review."}</p></div><button className="secondary-button" onClick={() => setShowResults(!showResults)}>{showResults ? "HIDE REPORT" : "VIEW RACE REPORT"} ↗</button></div>}
        {showResults && (race.status === "finished" || race.status === "gameover") && <RaceReport race={race}/>}
      </section>
      <section className="panel standings-panel"><div className="panel-heading"><div><div className="section-kicker">TIMING TOWER</div><h2>Race classification</h2></div><span className="field-count">22 CARS</span></div>
        <div className="standings-table"><div className="table-header"><span>POS</span><span>DRIVER / TEAM</span><span>GAP</span><span>TYRE</span></div>
          {order.map((car, index) => <div className={"standings-row " + (car.playerCar ? "player-row" : "")} key={car.id}><span className="position">{String(index + 1).padStart(2, "0")}</span><span className="driver-cell"><i style={{ background: car.teamColor }}/><span><strong>{car.driver}</strong><small>{car.team}</small></span>{car.playerCar && <b className="you-tag">YOU</b>}</span><span className="gap-cell">{index === 0 ? "LEADER" : car.finished && order[0].finished ? "+" + ((car.finishTime ?? 0) - (order[0].finishTime ?? 0)).toFixed(1) + "s" : "+" + Math.max(0, (order[0].progress - car.progress) * 91.4).toFixed(1) + "s"}</span><span className={"tyre-mini tyre-" + car.tyre.toLowerCase()}>{car.tyre[0]}</span></div>)}
        </div><div className="standings-foot"><span><i className="dot red"/> {playerTeamName.toUpperCase()}</span><span>POSITION UPDATES LIVE</span></div>
      </section>
      </div>
      <div className="content-column right-column">
      {(race.safetyCarActive || (race.incidentCount ?? 0) > 0) && <section className={"race-control-alert" + (race.safetyCarActive ? " safety-car-alert" : "")} role="status"><span>{race.safetyCarActive ? "SC" : "!"}</span><div><strong>{race.safetyCarActive ? "SAFETY CAR DEPLOYED" : "RACE CONTROL · INCIDENTS"}</strong><p>{race.safetyCarActive ? "Field neutralised. Tyre wear and fuel consumption are reduced; consider pitting if the stop loss is favourable." : (race.incidentCount ?? 0) + " incident(s) reported this race. Monitor component condition and traffic."}</p></div></section>}
       <section className="panel strategy-panel"><div className="panel-heading"><div><div className="section-kicker">PIT WALL</div><h2>Race engineer console</h2></div><span className="strategy-count">02 CARS</span></div>
        <div className="race-controls pitwall-race-controls"><div className="control-left"><button className="primary-button" disabled={race.status === "finished" || race.status === "gameover"} onClick={() => setRace((current) => ({ ...current, status: current.status === "running" ? "paused" : "running" }))}><span>{race.status === "running" ? "Ⅱ" : "▶"}</span>{race.status === "running" ? "PAUSE" : race.status === "paused" ? "RESUME RACE" : "START RACE"}</button>{race.status === "running" && <span className="running-copy">● RACE RUNNING</span>}{race.status === "paused" && <span className="paused-copy">RACE PAUSED</span>}</div><div className="speed-control"><span>SIM SPEED</span>{[1, 2, 4].map((n) => <button key={n} className={speed === n ? "speed-active" : ""} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        <div className="strategy-grid">{race.cars.filter((car) => car.playerCar).map((car) => {
          const advice = getStrategyAdvice(race, car.id);
          return <DriverStrategy key={car.id} car={car} status={race.status} teamName={playerTeamName} advice={advice}
            onApplyAdvice={() => { if (!advice) return; if (advice.action === "PIT") setStrategy(car, { pitLap: Math.max(3, Math.min(race.totalLaps - 1, Math.floor(car.progress) + 1)) }); else setStrategy(car, { pace: advice.action }); }}
            onPace={(pace) => setStrategy(car, { pace })} onTyre={(nextTyre) => setStrategy(car, { nextTyre })} onPitLap={(pitLap) => setStrategy(car, { pitLap })}/>;
        })}</div>
        <div className="engineer-note"><span className="engineer-icon">i</span><div><strong>ENGINEER'S NOTE</strong><p>{race.status === "finished" ? "Review the report, then fit an upgrade to prepare for the next weekend." : race.safetyCarActive ? "Safety car conditions reduce tyre wear and fuel use. This can be a low-cost pit window, but calling both cars together may cost track position." : race.cars.some((car) => car.playerCar && car.tyreWear > .7) ? "Tyre wear is high. CONSERVE protects the stint; PUSH trades tyre life and fuel for lap time. Adjust each car independently." : "Tyre life is manageable. PUSH gains pace but burns more fuel and rubber; CONSERVE extends the stint. Watch traffic and avoid exposing both cars to the same strategy."}</p></div></div>
      </section>
      <section className="panel event-panel"><div className="panel-heading"><div><div className="section-kicker">RACE RADIO</div><h2>Event log</h2></div><span className="event-count">{race.events.length} EVENTS</span></div><div className="event-list">{race.events.slice(0, 8).map((item) => <div className="event-item" key={item.id}><span className={"event-marker marker-" + item.kind}>{item.kind === "pit" ? "P" : item.kind === "battle" ? "↗" : item.kind === "finish" ? "■" : "·"}</span><div><span className="event-lap">LAP {String(item.lap).padStart(2, "0")} · RACE CONTROL</span><p>{item.message}</p></div></div>)}</div></section>
      </div>
      {race.status === "finished" && <section className="panel upgrade-panel roguelite-panel">
        <div className="upgrade-copy">
          <div className="section-kicker">ENGINEERING DEPARTMENT · POST-RACE DRAFT</div>
          <h2>Three leads. One breakthrough.</h2>
          <p>Your engineers have surfaced three opportunities from the weekend's data. Pick one to carry through the rest of this 20-round run. Offers are randomised each round, and rare breakthroughs can change your team's direction.</p>
          <div className="upgrade-meta"><span>TEAM BUDGET <b>{money(race.cash)}</b></span><span>DEVELOPMENT PICKS <b>{race.upgradeLevel}</b></span><span>ROUND COMPLETED <b>{String(race.weekendNumber).padStart(2, "0")}</b></span></div>
          <div className="rogue-draft-grid">
            {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => setSelectedDraftId(card.id)}>
              <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
              <span className="rogue-card-art"><UpgradeIcon type={card.upgradeType}/></span>
              <span className="rogue-card-subtitle">{card.subtitle}</span>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
              <span className="rogue-card-effect">{card.effect}</span>
              <span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
            </button>)}
          </div>
          <p className="rogue-rule-note">One pick per race · Permanent for this run · Synergies reward focused development; performance has trade-offs</p>
        </div>
        <div className="upgrade-action rogue-selection">
          <div className="upgrade-symbol">✦</div>
          <span className="selected-package-label">YOUR NEXT BREAKTHROUGH</span>
          <strong>{selectedDraft?.title ?? "Choose a development card"}</strong>
          <p className="selected-package-description">{selectedDraft?.description ?? "Select one of the three engineering offers."}</p>
          {selectedDraft && <div className="upgrade-summary-row"><span>RARITY</span><b className={"rarity-text-" + selectedDraft.rarity.toLowerCase()}>{selectedDraft.rarity}</b></div>}
          {selectedDraft && <div className="upgrade-summary-row"><span>REWARD</span><b>{selectedDraft.effect}</b></div>}
          <div className="upgrade-summary-row"><span>CAREER DEVELOPMENT</span><b>{race.upgradeLevel} PICKS COMPLETED</b></div>
          <button className="primary-button" disabled={!selectedDraft} onClick={() => { if (selectedDraft) { setRace((current) => upgradeCar(current, selectedDraft.id)); setShowResults(false); setSelectedDraftId(""); } }}>LOCK IN PICK & CONTINUE ↗</button>
          <p className="upgrade-install-note">Your choice is permanent. Future races bring a fresh set of offers.</p>
          <button className="text-button" onClick={resetCareer}>START NEW CAREER</button>
        </div>
      </section>}
    </div>
    {race.status === "gameover" && <section className="panel gameover-panel">
      <div className="gameover-kicker">REDLINE PADDOCK · RUN COMPLETE</div>
      <h2>Chequered flag. <em>Game over.</em></h2>
      <p className="gameover-intro">The 20-round campaign is complete. Your engineering draft is retired with this run; a fresh campaign starts from baseline specification.</p>
      <div className="gameover-stats">
        <div><span>TEAM CHAMPIONSHIP</span><strong>{redlineRank ? "P" + redlineRank : "—"} <small>/ 11</small></strong></div>
        <div><span>REDLINE POINTS</span><strong>{redlinePoints}</strong></div>
        <div><span>UPGRADES DRAFTED</span><strong>{race.upgradeLevel}</strong></div>
        <div><span>FINAL TEAM BUDGET</span><strong>{money(race.cash)}</strong></div>
      </div>
      <div className="gameover-lower">
        <div><strong>CHAMPIONSHIP ORDER</strong>{teamRankings.map(([team, points], index) => <div className={"team-points-row " + (team === playerTeamName ? "team-points-player" : "")} key={team}><span>{String(index + 1).padStart(2, "0")} · {team}</span><b>{points} PTS</b></div>)}</div>
        <div className="gameover-best"><span>PERSONAL BEST · LOCAL RECORD</span><strong>{bestRun ? bestRun.points + " POINTS" : "FIRST RUN"}</strong><p>{bestRun ? "Best championship score: P" + bestRun.position + " team finish. This record survives a new run on this device." : "Finish a campaign to set your first personal-best record."}</p><button className="primary-button" onClick={() => { setRace(createRace(Date.now() >>> 0, 0, 2500000, 1, playerTeamName, selectedDriverOne, selectedDriverTwo, race.playerPrincipalName ?? principalNameDraft)); setShowResults(false); setSelectedDraftId(""); }}>START NEW RUN ↗</button></div>
      </div>
    </section>}

    {showSaveTransfer && <div className="save-transfer-overlay" role="dialog" aria-modal="true" aria-labelledby="save-transfer-title">
      <section className="save-transfer-panel">
        <div className="save-transfer-heading"><div><span className="section-kicker">CAREER DATA MANAGEMENT</span><h2 id="save-transfer-title">Save <em>& transfer.</em></h2><p>Move your career and permanent Garage blueprints between browsers or devices. No account required.</p></div><button className="save-transfer-close" aria-label="Close save transfer" onClick={() => setShowSaveTransfer(false)}>×</button></div>
        <div className="save-transfer-columns">
          <section className="save-transfer-card"><span className="save-transfer-step">01 / EXPORT</span><h3>Generate a save code</h3><p>Includes your current race or career, car upgrades, standings, research, permanent blueprints and personal best.</p><button className="primary-button" onClick={exportSaveCode}>GENERATE SAVE CODE ↗</button>
            {saveCode && <><label htmlFor="save-code-output">YOUR SAVE CODE</label><textarea id="save-code-output" readOnly value={saveCode} rows={5} onFocus={(event) => event.currentTarget.select()} /><button className="save-transfer-secondary" onClick={() => { if (!navigator.clipboard?.writeText) { setSaveTransferMessage("Select the code above and copy it manually."); return; } void navigator.clipboard.writeText(saveCode).then(() => setSaveTransferMessage("Save code copied to clipboard."), () => setSaveTransferMessage("Select the code above and copy it manually.")); }}>COPY CODE</button></>}
          </section>
          <section className="save-transfer-card"><span className="save-transfer-step">02 / IMPORT</span><h3>Restore a career</h3><p>Paste a previously exported code. We verify it before asking to replace the current local career.</p><label htmlFor="save-code-import">PASTE SAVE CODE</label><textarea id="save-code-import" value={importCode} onChange={(event) => setImportCode(event.target.value)} placeholder="RLP1.… paste your full code here" rows={5} /><button className="primary-button" disabled={!importCode.trim()} onClick={importSaveCode}>VERIFY & IMPORT ↗</button>
          </section>
        </div>
        {saveTransferMessage && <p className="save-transfer-message" role="status">{saveTransferMessage}</p>}
        <div className="save-transfer-footnote"><span><i/> LOCAL AUTOSAVE ACTIVE</span><span>Keep your code private to your own backups; anyone with it can restore that save.</span></div>
      </section>
    </div>}
    <footer className="footer"><span>REDLINE PADDOCK · EARLY PLAYABLE BUILD</span><span>FICTIONAL SIMULATION · LOCAL SAVE ENABLED</span></footer>
  </main>;
}

function RaceReport({ race }: { race: RaceState }) {
  const order = standings(race);
  const best = [...race.cars].filter((car) => car.bestLap > 0).sort((a, b) => a.bestLap - b.bestLap)[0];
  const playerBest = [...race.cars].filter((car) => car.playerCar && car.bestLap > 0).sort((a, b) => a.bestLap - b.bestLap)[0];
  const playerPositions = order.map((car, index) => car.playerCar ? index + 1 : 0).filter(Boolean);
  const playerPosition = playerPositions[0] ?? 0;
  return <div className="report-box"><div className="report-heading"><span>POST-RACE ANALYSIS</span><strong>ROUND {String(race.weekendNumber).padStart(2, "0")}</strong></div><h3>{playerPosition <= 3 ? "Good work on the pit wall." : "The data tells a story."}</h3><p>{playerPosition <= 3 ? "A strong result. Keep building on this performance." : playerPosition <= 6 ? "A solid foundation. There is room to improve the next package." : "A difficult result, but useful data for the engineering team."}</p><div className="report-stats"><div><span>BEST LAP</span><strong>{best ? formatLapTime(best.bestLap) : "—"}</strong><small>{best ? best.driver : "No timing"}</small></div><div><span>REDLINE BEST</span><strong>{playerBest ? formatLapTime(playerBest.bestLap) : "—"}</strong><small>{playerBest ? playerBest.driver : "No timing"}</small></div><div><span>TEAM RESULT</span><strong>P{playerPosition} / P{playerPositions[1] ?? "—"}</strong><small>Two-car classification</small></div></div><div className="report-note">Seeded local simulation. This build models pace, tyre wear, fuel, pit stops and a simplified upgrade effect. Full damage, weather and regulations are planned for later.</div></div>;
}<section className="panel event-panel"><div className="panel-heading"><div><div className="section-kicker">RACE RADIO</div><h2>Event log</h2></div><span className="event-count">{race.events.length} EVENTS</span></div><div className="event-list">{race.events.slice(0, 8).map((item) => <div className="event-item" key={item.id}><span className={"event-marker marker-" + item.kind}>{item.kind === "pit" ? "P" : item.kind === "battle" ? "↗" : item.kind === "finish" ? "■" : "·"}</span><div><span className="event-lap">LAP {String(item.lap).padStart(2, "0")} · RACE CONTROL</span><p>{item.message}</p></div></div>)}</div></section><div className="start-screen-preview" style={{ "--team-primary": teamPrimaryColor, "--team-secondary": teamSecondaryColor } as React.CSSProperties}><span className="team-preview-swatch"/><div><small>YOUR CONSTRUCTOR</small><strong>{teamNameDraft.trim() || "YOUR TEAM NAME"}</strong><small className="principal-preview-label">TEAM PRINCIPAL</small><strong className="principal-preview-name">{principalNameDraft.trim() || "YOUR NAME"}</strong></div><span className="team-preview-number">07 / 22</span></div><section className="driver-market"><div className="driver-market-heading"><div><span className="market-eyebrow">DRIVER MARKET · PRE-SEASON</span><h2>Build your driver line-up.</h2></div><span className="market-seat-count">{selectedDriverOne && selectedDriverTwo ? "2 / 2 SEATS" : "SELECT 2 DRIVERS"}</span></div><p className="driver-market-copy">Choose two drivers before the season begins. Pace, racecraft, tyre management and consistency affect race performance; potential shows future upside.</p><div className="driver-market-seats"><div><small>SEAT 01</small><strong>{selectedDriverOne || "OPEN SEAT"}</strong></div><div><small>SEAT 02</small><strong>{selectedDriverTwo || "OPEN SEAT"}</strong></div></div><div className="driver-market-grid">{DRIVER_MARKET.map((driver) => { const seatOne = selectedDriverOne === driver.name; const seatTwo = selectedDriverTwo === driver.name; const overall = Math.round((driver.pace + driver.racecraft + driver.tyreManagement + driver.consistency) / 4); return <article className={"market-driver-card" + (seatOne || seatTwo ? " market-driver-selected" : "")} key={driver.id}><div className="market-driver-top"><span className="market-driver-number">#{String(DRIVER_MARKET.indexOf(driver) + 1).padStart(2, "0")}</span><span className="market-driver-overall">{overall}<small>OVR</small></span></div><div className="market-driver-identity"><DriverPortrait driver={driver} index={DRIVER_MARKET.indexOf(driver)} /><div className="market-driver-nameplate"><h3>{driver.name}</h3><span className="market-driver-role">{driver.role}</span></div></div><span className="market-driver-role">{driver.role}</span><div className="market-driver-stats">{[["PACE", driver.pace], ["RACECRAFT", driver.racecraft], ["TYRE MGMT", driver.tyreManagement], ["CONSISTENCY", driver.consistency], ["POTENTIAL", driver.potential]].map(([label, value]) => <div className="market-stat" key={label as string}><span>{label}</span><div><i style={{ width: (value as number) + "%" }}/></div><b>{value}</b></div>)}</div><div className="market-driver-actions"><button type="button" className={seatOne ? "selected-seat" : ""} disabled={seatTwo} onClick={() => setSelectedDriverOne(driver.name)}>{seatOne ? "✓ SEAT 01" : "SELECT · 01"}</button><button type="button" className={seatTwo ? "selected-seat" : ""} disabled={seatOne} onClick={() => setSelectedDriverTwo(driver.name)}>{seatTwo ? "✓ SEAT 02" : "SELECT · 02"}</button></div></article>; })}</div></section><button className="primary-button start-career-button" disabled={!teamNameDraft.trim() || !principalNameDraft.trim() || !selectedDriverOne || !selectedDriverTwo || selectedDriverOne === selectedDriverTwo} onClick={startCustomCareer}>CREATE TEAM & START SEASON <span>↗</span></button>{hasSavedCareer && <button className="continue-career-button" onClick={() => { setShowStartScreen(false); setShowInitialDraft(race.status === "ready" && race.upgradeLevel === 0 && race.weekendNumber === 1); }}>CONTINUE EXISTING CAREER <span>→</span></button>}<button className="start-save-transfer" onClick={() => { setShowSaveTransfer(true); setSaveTransferMessage(""); }}>IMPORT A SAVE CODE / TRANSFER CAREER ↗</button><p className="start-screen-footnote">20 ROUNDS · 22 DRIVERS · SINGLE-PLAYER MANAGEMENT</p></div><div className="start-screen-visual"><StartScreenCarGraphic primary={teamPrimaryColor} secondary={teamSecondaryColor}/><div className="start-visual-caption"><span>01</span> CHASSIS R-01 <i/> RACE ENGINEERING DIVISION</div></div></div>}
    {isInitialDraft && <div className="initial-upgrade-screen" role="dialog" aria-modal="true" aria-labelledby="initial-upgrade-title">
      <div className="initial-upgrade-topline"><span>REDLINE PADDOCK <i/> PRE-SEASON DEVELOPMENT</span><span>ROUND 01 / 20</span></div>
      <div className="initial-upgrade-content">
        <div className="initial-upgrade-kicker">YOUR RUN STARTS HERE · DEVELOPMENT PICK 01</div>
        <h1 id="initial-upgrade-title">Define your <em>advantage.</em></h1>
        <p className="initial-upgrade-intro">Before the lights go out, your engineers have secured three development opportunities. Choose one permanent upgrade to shape your run. Every pick has a trade-off, and your build will evolve from here.</p>
        <div className="rogue-draft-grid initial-rogue-grid">
          {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => setSelectedDraftId(card.id)}>
            <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
            <span className="rogue-card-art"><UpgradeIcon type={card.upgradeType}/></span>
            <span className="rogue-card-subtitle">{card.subtitle}</span>
            <strong>{card.title}</strong><p>{card.description}</p>
            <span className="rogue-card-effect">{card.effect}</span>
            <span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
          </button>)}
        </div>
        <div className="initial-upgrade-footer"><span>YOUR FIRST PICK IS PERMANENT · 19 MORE DEVELOPMENT PICKS AVAILABLE</span><button className="primary-button" disabled={!selectedDraft} onClick={() => { if (!selectedDraft) return; setRace((current) => applyStartingUpgrade(current, selectedDraft.id)); setShowInitialDraft(false); setSelectedDraftId(""); }}>INSTALL STARTING UPGRADE ↗</button></div>
      </div>
    </div>}
    {showIntermission && race.status === "finished" && <div className="career-intermission-screen" role="dialog" aria-modal="true" aria-labelledby="intermission-title">
      <div className="career-intermission-topline"><span>REDLINE PADDOCK <i/> BETWEEN RACES</span><span>ROUND {String(race.weekendNumber).padStart(2, "0")} COMPLETE</span></div>
      <div className="career-intermission-content">
        <div className="section-kicker">ENGINEERING DEPARTMENT · POST-RACE DEVELOPMENT</div>
        <h1 id="intermission-title">Build your <em>next advantage.</em></h1>
        <p className="career-intermission-intro">Review the weekend, choose one upgrade for this career, then visit the garage before heading to the next circuit.</p>
        <div className="intermission-summary"><span>TEAM BUDGET <b>{money(race.cash)}</b></span><span>DEVELOPMENT PICKS <b>{race.upgradeLevel}</b></span><span>RESEARCH BANK <b>✦ {garageMeta.research} RP</b></span></div>
        <div className="intermission-section-heading"><div><span>STEP 01</span><h2>Choose your next upgrade</h2></div><small>ONE PICK · THIS CAREER</small></div>
        <div className="rogue-draft-grid intermission-upgrade-grid">
          {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => { setSelectedDraftId(card.id); setIntermissionUpgradeInstalled(false); }}>
            <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
            <span className="rogue-card-art"><UpgradeIcon type={card.upgradeType}/></span><span className="rogue-card-subtitle">{card.subtitle}</span><strong>{card.title}</strong><p>{card.description}</p><span className="rogue-card-effect">{card.effect}</span><span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
          </button>)}
        </div>
        <div className="intermission-action-row">
          <div><span className="section-kicker">SELECTED DEVELOPMENT</span><strong>{selectedDraft?.title ?? "Choose one offer above"}</strong><p>{intermissionUpgradeInstalled ? "Upgrade installed. You can now continue to the garage and next race." : "Lock in your choice before moving to the garage."}</p></div>
          <button className="primary-button" disabled={!selectedDraft || intermissionUpgradeInstalled} onClick={() => { if (!selectedDraft) return; setRace((current) => upgradeCar(current, selectedDraft.id)); setIntermissionUpgradeInstalled(true); setShowResults(false); }}> {intermissionUpgradeInstalled ? "UPGRADE INSTALLED ✓" : "INSTALL UPGRADE ↗"}</button>
        </div>
        <div className="intermission-section-heading garage-intermission-heading"><div><span>STEP 02</span><h2>Development garage</h2></div><span className="research-counter">✦ {garageMeta.research} RESEARCH</span></div>
        <p className="garage-progression-intro">Spend research on permanent blueprints that carry into future careers. Completed races earn 1 RP, with a podium bonus of 1 RP.</p>
        <div className="garage-perk-grid">
          {GARAGE_PERKS.map((perk) => { const owned = garageMeta.unlocks.includes(perk.id); const affordable = garageMeta.research >= perk.cost; return <article className={"garage-perk-card" + (owned ? " garage-perk-owned" : "")} key={perk.id}>
            <div className="garage-perk-top"><span>{perk.category}</span><b>{owned ? "UNLOCKED" : perk.cost + " RP"}</b></div><h3>{perk.title}</h3><p>{perk.description}</p>
            <button className={owned ? "garage-perk-button owned" : "garage-perk-button"} disabled={owned || !affordable} onClick={() => buyGaragePerk(perk.id, perk.cost)}>{owned ? "✓ PERMANENT BLUEPRINT" : affordable ? "UNLOCK BLUEPRINT ↗" : "NEED " + (perk.cost - garageMeta.research) + " MORE RP"}</button>
          </article>; })}
        </div>
        <div className="intermission-bottom-row"><span>PERMANENT BLUEPRINTS: {garageMeta.unlocks.length}/{GARAGE_PERKS.length} · SAVED LOCALLY</span><button className="primary-button" disabled={!intermissionUpgradeInstalled} onClick={startNextRace}>NEXT RACE ↗</button></div>
      </div>
    </div>}
    <header className="topbar"><a className="brand" href="#" aria-label="Redline Paddock home"><svg className="brand-mark-svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="14" fill="#0B0B10"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="13.3" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.5"/><g transform="translate(6.8 0) skewX(-12)"><path fill="#F4F4F6" fillRule="evenodd" d="M16 14L38 14L48 19L50 26L50 29L47 35L41 38L24 38L24 50L16 50ZM24 21L36 21L42 24L42 28L36 31L24 31Z"/><path fill="#FF1E00" d="M30 38L40 38L51 50L40.5 50Z"/></g></svg><span className="brand-text"><b>REDLINE PADDOCK</b><span>RACE OPERATIONS SIMULATOR</span></span></a><nav className="main-nav"><span className="nav-active">OPERATIONS</span><span>ENGINEERING</span><span>CHAMPIONSHIP</span></nav><div className="top-status"><i className="status-dot"/> PROTOTYPE <b/> {savedAt}<button className="save-transfer-trigger" onClick={() => { setShowSaveTransfer(true); setSaveTransferMessage(""); }}>SAVE / TRANSFER</button></div></header>
    <section className="page-heading"><div className="heading-copy"><div className="eyebrow">TEAM PRINCIPAL: {race.playerPrincipalName ?? "Team Principal"} <b>/</b> TEAM OPERATIONS <b>/</b> ROUND {String(Math.min(race.weekendNumber, CAMPAIGN_LENGTH)).padStart(2, "0")} / {CAMPAIGN_LENGTH}</div><h1>Race <em>Control.</em></h1><p>Every decision has a cost. Every lap is an opportunity.</p></div><PitWallGraphic /><div className="weekend-status"><i className={"live-indicator " + (race.status === "running" ? "is-live" : "")}/><div><strong>{race.status === "running" ? "SESSION LIVE" : race.status === "finished" || race.status === "gameover" ? "SESSION COMPLETE" : race.status === "paused" ? "SESSION PAUSED" : "RACE WEEKEND"}</strong><span>{(race.circuitName ?? "Copperhead Ring").toUpperCase()} · GENERATED CIRCUIT</span></div></div></section>
    <section className="stat-strip">
      <div className="stat-cell"><span>TEAM BUDGET</span><strong>{money(race.cash)}</strong><small>{race.upgradeLevel ? "PACKAGE LEVEL " + race.upgradeLevel : "INITIAL ALLOCATION"}</small></div>
      <div className="stat-cell"><span>CAR PERFORMANCE</span><strong>{Math.min(100, 82 + modules.aero * 2 + modules.power * 3 + modules.suspension + modules.reliability)}<small className="inline-unit"> / 100</small></strong><small>{race.upgradeLevel ? "DRAFTED SPEC" : "BASELINE SPEC"}</small></div>
      <div className="stat-cell"><span>RACE PROGRESS</span><strong>{Math.min(race.lap, race.totalLaps)}<small className="inline-unit"> / {race.totalLaps} LAPS</small></strong><small>{finishedCount}/22 CARS FINISHED</small></div>
      <div className="stat-cell"><span>YOUR BEST LAP</span><strong>{formatLapTime(bestLap)}</strong><small>SESSION TIMING</small></div>
    </section>
    <section className="panel current-upgrades-panel" aria-label="Current team upgrades">
      <div className="panel-heading"><div><div className="section-kicker">CAR DEVELOPMENT · CURRENT SPEC</div><h2>Installed upgrades</h2></div><span className="upgrade-count-badge">{(race.installedUpgrades ?? []).length} FITTED</span></div>
      <div className="upgrade-module-strip">
        {([{ key: "aero", label: "AERODYNAMICS", icon: "A" }, { key: "power", label: "POWER UNIT", icon: "P" }, { key: "suspension", label: "MECHANICAL GRIP", icon: "S" }, { key: "reliability", label: "RELIABILITY", icon: "R" }] as const).map((module) => <div className="upgrade-module-meter" key={module.key}><span className={"upgrade-module-icon module-" + module.key}>{module.icon}</span><div><small>{module.label}</small><strong>LEVEL {modules[module.key]}</strong><div className="upgrade-module-track"><i style={{ width: Math.min(100, modules[module.key] * 20) + "%" }} /></div></div></div>)}
      </div>
      {(race.installedUpgrades ?? []).length > 0 ? <div className="installed-upgrade-list">{[...(race.installedUpgrades ?? [])].reverse().map((upgrade, index) => <article className="installed-upgrade-item" key={upgrade.id + "-" + index}><span className={"installed-upgrade-icon " + (upgrade.upgradeType ? "type-" + upgrade.upgradeType : "type-commercial")}>{upgrade.upgradeType ? upgrade.upgradeType === "aero" ? "A" : upgrade.upgradeType === "power" ? "P" : upgrade.upgradeType === "suspension" ? "S" : "R" : "₥"}</span><div className="installed-upgrade-copy"><div><span>{upgrade.subtitle}</span><b className={"rarity-label rarity-text-" + upgrade.rarity.toLowerCase()}>{upgrade.rarity}</b></div><strong>{upgrade.title}</strong><small>{upgrade.effect}</small></div></article>)}</div> : <div className="upgrade-empty-state"><span>+</span><div><strong>No career upgrades installed yet</strong><p>Your selected development cards will be listed here after you fit your first upgrade. Permanent Garage blueprints are tracked separately.</p></div></div>}
      <div className="current-upgrades-foot"><span>CAREER BUILD · {race.upgradeLevel} DEVELOPMENT PICKS</span><span>{buildSynergies(modules).length} ACTIVE SYNERGIES</span></div>
    </section>
    {(race.status === "finished" || race.status === "gameover") && <><section className="build-intel" aria-label="Engineering build profile">
      <div className="build-intel-heading"><span>ENGINEERING PROFILE</span><b>{buildSynergies(modules).length === 1 ? "1 ACTIVE SYNERGY" : buildSynergies(modules).length + " ACTIVE SYNERGIES"}</b></div>
      <div className="build-intel-items">
        <div className="build-tradeoff"><strong>DEVELOPMENT TRADE-OFFS</strong><span>Aero increases tyre load · Power packages use more fuel</span></div>
        {buildSynergies(modules).length === 0 ? <div className="build-synergy-empty">No build synergy yet. Invest in two related departments to unlock a combined effect.</div> : buildSynergies(modules).map((synergy) => <div className="build-synergy" key={synergy}><strong>{synergy}</strong><span>{synergy === "AERO + POWER INTEGRATION" ? "Extra 0.10s pace per lap from a coordinated aero and power package." : "10% less tyre wear and component condition loss from an endurance-focused platform."}</span></div>)}
      </div>
    </section>
    <section className="panel garage-progression-panel">
      <div className="panel-heading"><div><div className="section-kicker">BETWEEN-RUN PROGRESSION</div><h2>Development garage</h2></div><span className="research-counter">✦ {garageMeta.research} RESEARCH</span></div>
      <p className="garage-progression-intro">Every completed Grand Prix earns 1 research point. Finish on the podium with either car to earn 1 bonus point. Spend research on permanent blueprints that carry into every new career.</p>
      <div className="garage-perk-grid">
        {GARAGE_PERKS.map((perk) => {
          const owned = garageMeta.unlocks.includes(perk.id);
          const affordable = garageMeta.research >= perk.cost;
          return <article className={"garage-perk-card" + (owned ? " garage-perk-owned" : "")} key={perk.id}>
            <div className="garage-perk-top"><span>{perk.category}</span><b>{owned ? "UNLOCKED" : perk.cost + " RP"}</b></div>
            <h3>{perk.title}</h3><p>{perk.description}</p>
            <button className={owned ? "garage-perk-button owned" : "garage-perk-button"} disabled={owned || !affordable} onClick={() => buyGaragePerk(perk.id, perk.cost)}>{owned ? "✓ PERMANENT BLUEPRINT" : affordable ? "UNLOCK BLUEPRINT ↗" : "NEED " + (perk.cost - garageMeta.research) + " MORE RP"}</button>
          </article>;
        })}
      </div>
      <div className="garage-progression-foot"><span>PERMANENT UNLOCKS: {garageMeta.unlocks.length}/{GARAGE_PERKS.length}</span><span>RESEARCH IS SAVED LOCALLY ACROSS CAREERS</span></div>
    </section></>}
    <div className="content-grid">
      <div className="content-column left-column">
      <section className="panel race-panel">
        <div className="panel-heading"><div><div className="section-kicker">LIVE TELEMETRY <i className="tiny-live"/></div><h2>Race overview</h2></div><div className="lap-badge">LAP <strong>{String(Math.min(race.lap, race.totalLaps)).padStart(2, "0")}</strong><span>/ {race.totalLaps}</span></div></div>
        <CircuitMap cars={race.cars} lap={race.lap} teamName={playerTeamName} circuitSeed={race.circuitSeed ?? race.seed} circuitName={race.circuitName ?? "Copperhead Ring"}/>

        {(race.status === "finished" || race.status === "gameover") && <div className="finish-banner"><div><span className="section-kicker">CHEQUERED FLAG</span><h3>{race.status === "gameover" ? "Campaign complete." : "Race complete."}</h3><p>{race.status === "gameover" ? "Twenty rounds. Final points are locked." : "Prize income and classification are ready for review."}</p></div><button className="secondary-button" onClick={() => setShowResults(!showResults)}>{showResults ? "HIDE REPORT" : "VIEW RACE REPORT"} ↗</button></div>}
        {showResults && (race.status === "finished" || race.status === "gameover") && <RaceReport race={race}/>}
      </section>
      <section className="panel event-panel"><div className="panel-heading"><div><div className="section-kicker">RACE RADIO</div><h2>Event log</h2></div><span className="event-count">{race.events.length} EVENTS</span></div><div className="event-list">{race.events.slice(0, 8).map((item) => <div className="event-item" key={item.id}><span className={"event-marker marker-" + item.kind}>{item.kind === "pit" ? "P" : item.kind === "battle" ? "↗" : item.kind === "finish" ? "■" : "·"}</span><div><span className="event-lap">LAP {String(item.lap).padStart(2, "0")} · RACE CONTROL</span><p>{item.message}</p></div></div>)}</div></section>
      </div>
      <div className="content-column right-column">
      {(race.safetyCarActive || (race.incidentCount ?? 0) > 0) && <section className={"race-control-alert" + (race.safetyCarActive ? " safety-car-alert" : "")} role="status"><span>{race.safetyCarActive ? "SC" : "!"}</span><div><strong>{race.safetyCarActive ? "SAFETY CAR DEPLOYED" : "RACE CONTROL · INCIDENTS"}</strong><p>{race.safetyCarActive ? "Field neutralised. Tyre wear and fuel consumption are reduced; consider pitting if the stop loss is favourable." : (race.incidentCount ?? 0) + " incident(s) reported this race. Monitor component condition and traffic."}</p></div></section>}
       <section className="panel strategy-panel"><div className="panel-heading"><div><div className="section-kicker">PIT WALL</div><h2>Race engineer console</h2></div><span className="strategy-count">02 CARS</span></div>
        <div className="race-controls pitwall-race-controls"><div className="control-left"><button className="primary-button" disabled={race.status === "finished" || race.status === "gameover"} onClick={() => setRace((current) => ({ ...current, status: current.status === "running" ? "paused" : "running" }))}><span>{race.status === "running" ? "Ⅱ" : "▶"}</span>{race.status === "running" ? "PAUSE" : race.status === "paused" ? "RESUME RACE" : "START RACE"}</button>{race.status === "running" && <span className="running-copy">● RACE RUNNING</span>}{race.status === "paused" && <span className="paused-copy">RACE PAUSED</span>}</div><div className="speed-control"><span>SIM SPEED</span>{[1, 2, 4].map((n) => <button key={n} className={speed === n ? "speed-active" : ""} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        <div className="strategy-grid">{race.cars.filter((car) => car.playerCar).map((car) => {
          const advice = getStrategyAdvice(race, car.id);
          return <DriverStrategy key={car.id} car={car} status={race.status} teamName={playerTeamName} advice={advice}
            onApplyAdvice={() => { if (!advice) return; if (advice.action === "PIT") setStrategy(car, { pitLap: Math.max(3, Math.min(race.totalLaps - 1, Math.floor(car.progress) + 1)) }); else setStrategy(car, { pace: advice.action }); }}
            onPace={(pace) => setStrategy(car, { pace })} onTyre={(nextTyre) => setStrategy(car, { nextTyre })} onPitLap={(pitLap) => setStrategy(car, { pitLap })}/>;
        })}</div>
        <div className="engineer-note"><span className="engineer-icon">i</span><div><strong>ENGINEER'S NOTE</strong><p>{race.status === "finished" ? "Review the report, then fit an upgrade to prepare for the next weekend." : race.safetyCarActive ? "Safety car conditions reduce tyre wear and fuel use. This can be a low-cost pit window, but calling both cars together may cost track position." : race.cars.some((car) => car.playerCar && car.tyreWear > .7) ? "Tyre wear is high. CONSERVE protects the stint; PUSH trades tyre life and fuel for lap time. Adjust each car independently." : "Tyre life is manageable. PUSH gains pace but burns more fuel and rubber; CONSERVE extends the stint. Watch traffic and avoid exposing both cars to the same strategy."}</p></div></div>
      </section>
      <section className="panel event-panel"><div className="panel-heading"><div><div className="section-kicker">RACE RADIO</div><h2>Event log</h2></div><span className="event-count">{race.events.length} EVENTS</span></div><div className="event-list">{race.events.slice(0, 8).map((item) => <div className="event-item" key={item.id}><span className={"event-marker marker-" + item.kind}>{item.kind === "pit" ? "P" : item.kind === "battle" ? "↗" : item.kind === "finish" ? "■" : "·"}</span><div><span className="event-lap">LAP {String(item.lap).padStart(2, "0")} · RACE CONTROL</span><p>{item.message}</p></div></div>)}</div></section>
      </div>
      {race.status === "finished" && <section className="panel upgrade-panel roguelite-panel">
        <div className="upgrade-copy">
          <div className="section-kicker">ENGINEERING DEPARTMENT · POST-RACE DRAFT</div>
          <h2>Three leads. One breakthrough.</h2>
          <p>Your engineers have surfaced three opportunities from the weekend's data. Pick one to carry through the rest of this 20-round run. Offers are randomised each round, and rare breakthroughs can change your team's direction.</p>
          <div className="upgrade-meta"><span>TEAM BUDGET <b>{money(race.cash)}</b></span><span>DEVELOPMENT PICKS <b>{race.upgradeLevel}</b></span><span>ROUND COMPLETED <b>{String(race.weekendNumber).padStart(2, "0")}</b></span></div>
          <div className="rogue-draft-grid">
            {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => setSelectedDraftId(card.id)}>
              <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
              <span className="rogue-card-art"><UpgradeIcon type={card.upgradeType}/></span>
              <span className="rogue-card-subtitle">{card.subtitle}</span>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
              <span className="rogue-card-effect">{card.effect}</span>
              <span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
            </button>)}
          </div>
          <p className="rogue-rule-note">One pick per race · Permanent for this run · Synergies reward focused development; performance has trade-offs</p>
        </div>
        <div className="upgrade-action rogue-selection">
          <div className="upgrade-symbol">✦</div>
          <span className="selected-package-label">YOUR NEXT BREAKTHROUGH</span>
          <strong>{selectedDraft?.title ?? "Choose a development card"}</strong>
          <p className="selected-package-description">{selectedDraft?.description ?? "Select one of the three engineering offers."}</p>
          {selectedDraft && <div className="upgrade-summary-row"><span>RARITY</span><b className={"rarity-text-" + selectedDraft.rarity.toLowerCase()}>{selectedDraft.rarity}</b></div>}
          {selectedDraft && <div className="upgrade-summary-row"><span>REWARD</span><b>{selectedDraft.effect}</b></div>}
          <div className="upgrade-summary-row"><span>CAREER DEVELOPMENT</span><b>{race.upgradeLevel} PICKS COMPLETED</b></div>
          <button className="primary-button" disabled={!selectedDraft} onClick={() => { if (selectedDraft) { setRace((current) => upgradeCar(current, selectedDraft.id)); setShowResults(false); setSelectedDraftId(""); } }}>LOCK IN PICK & CONTINUE ↗</button>
          <p className="upgrade-install-note">Your choice is permanent. Future races bring a fresh set of offers.</p>
          <button className="text-button" onClick={resetCareer}>START NEW CAREER</button>
        </div>
      </section>}
    </div>
    {race.status === "gameover" && <section className="panel gameover-panel">
      <div className="gameover-kicker">REDLINE PADDOCK · RUN COMPLETE</div>
      <h2>Chequered flag. <em>Game over.</em></h2>
      <p className="gameover-intro">The 20-round campaign is complete. Your engineering draft is retired with this run; a fresh campaign starts from baseline specification.</p>
      <div className="gameover-stats">
        <div><span>TEAM CHAMPIONSHIP</span><strong>{redlineRank ? "P" + redlineRank : "—"} <small>/ 11</small></strong></div>
        <div><span>REDLINE POINTS</span><strong>{redlinePoints}</strong></div>
        <div><span>UPGRADES DRAFTED</span><strong>{race.upgradeLevel}</strong></div>
        <div><span>FINAL TEAM BUDGET</span><strong>{money(race.cash)}</strong></div>
      </div>
      <div className="gameover-lower">
        <div><strong>CHAMPIONSHIP ORDER</strong>{teamRankings.map(([team, points], index) => <div className={"team-points-row " + (team === playerTeamName ? "team-points-player" : "")} key={team}><span>{String(index + 1).padStart(2, "0")} · {team}</span><b>{points} PTS</b></div>)}</div>
        <div className="gameover-best"><span>PERSONAL BEST · LOCAL RECORD</span><strong>{bestRun ? bestRun.points + " POINTS" : "FIRST RUN"}</strong><p>{bestRun ? "Best championship score: P" + bestRun.position + " team finish. This record survives a new run on this device." : "Finish a campaign to set your first personal-best record."}</p><button className="primary-button" onClick={() => { setRace(createRace(Date.now() >>> 0, 0, 2500000, 1, playerTeamName, selectedDriverOne, selectedDriverTwo, race.playerPrincipalName ?? principalNameDraft)); setShowResults(false); setSelectedDraftId(""); }}>START NEW RUN ↗</button></div>
      </div>
    </section>}

    {showSaveTransfer && <div className="save-transfer-overlay" role="dialog" aria-modal="true" aria-labelledby="save-transfer-title">
      <section className="save-transfer-panel">
        <div className="save-transfer-heading"><div><span className="section-kicker">CAREER DATA MANAGEMENT</span><h2 id="save-transfer-title">Save <em>& transfer.</em></h2><p>Move your career and permanent Garage blueprints between browsers or devices. No account required.</p></div><button className="save-transfer-close" aria-label="Close save transfer" onClick={() => setShowSaveTransfer(false)}>×</button></div>
        <div className="save-transfer-columns">
          <section className="save-transfer-card"><span className="save-transfer-step">01 / EXPORT</span><h3>Generate a save code</h3><p>Includes your current race or career, car upgrades, standings, research, permanent blueprints and personal best.</p><button className="primary-button" onClick={exportSaveCode}>GENERATE SAVE CODE ↗</button>
            {saveCode && <><label htmlFor="save-code-output">YOUR SAVE CODE</label><textarea id="save-code-output" readOnly value={saveCode} rows={5} onFocus={(event) => event.currentTarget.select()} /><button className="save-transfer-secondary" onClick={() => { if (!navigator.clipboard?.writeText) { setSaveTransferMessage("Select the code above and copy it manually."); return; } void navigator.clipboard.writeText(saveCode).then(() => setSaveTransferMessage("Save code copied to clipboard."), () => setSaveTransferMessage("Select the code above and copy it manually.")); }}>COPY CODE</button></>}
          </section>
          <section className="save-transfer-card"><span className="save-transfer-step">02 / IMPORT</span><h3>Restore a career</h3><p>Paste a previously exported code. We verify it before asking to replace the current local career.</p><label htmlFor="save-code-import">PASTE SAVE CODE</label><textarea id="save-code-import" value={importCode} onChange={(event) => setImportCode(event.target.value)} placeholder="RLP1.… paste your full code here" rows={5} /><button className="primary-button" disabled={!importCode.trim()} onClick={importSaveCode}>VERIFY & IMPORT ↗</button>
          </section>
        </div>
        {saveTransferMessage && <p className="save-transfer-message" role="status">{saveTransferMessage}</p>}
        <div className="save-transfer-footnote"><span><i/> LOCAL AUTOSAVE ACTIVE</span><span>Keep your code private to your own backups; anyone with it can restore that save.</span></div>
      </section>
    </div>}
    <footer className="footer"><span>REDLINE PADDOCK · EARLY PLAYABLE BUILD</span><span>FICTIONAL SIMULATION · LOCAL SAVE ENABLED</span></footer>
  </main>;
}

function RaceReport({ race }: { race: RaceState }) {
  const order = standings(race);
  const best = [...race.cars].filter((car) => car.bestLap > 0).sort((a, b) => a.bestLap - b.bestLap)[0];
  const playerBest = [...race.cars].filter((car) => car.playerCar && car.bestLap > 0).sort((a, b) => a.bestLap - b.bestLap)[0];
  const playerPositions = order.map((car, index) => car.playerCar ? index + 1 : 0).filter(Boolean);
  const playerPosition = playerPositions[0] ?? 0;
  return <div className="report-box"><div className="report-heading"><span>POST-RACE ANALYSIS</span><strong>ROUND {String(race.weekendNumber).padStart(2, "0")}</strong></div><h3>{playerPosition <= 3 ? "Good work on the pit wall." : "The data tells a story."}</h3><p>{playerPosition <= 3 ? "A strong result. Keep building on this performance." : playerPosition <= 6 ? "A solid foundation. There is room to improve the next package." : "A difficult result, but useful data for the engineering team."}</p><div className="report-stats"><div><span>BEST LAP</span><strong>{best ? formatLapTime(best.bestLap) : "—"}</strong><small>{best ? best.driver : "No timing"}</small></div><div><span>REDLINE BEST</span><strong>{playerBest ? formatLapTime(playerBest.bestLap) : "—"}</strong><small>{playerBest ? playerBest.driver : "No timing"}</small></div><div><span>TEAM RESULT</span><strong>P{playerPosition} / P{playerPositions[1] ?? "—"}</strong><small>Two-car classification</small></div></div><div className="report-note">Seeded local simulation. This build models pace, tyre wear, fuel, pit stops and a simplified upgrade effect. Full damage, weather and regulations are planned for later.</div></div>;
}
