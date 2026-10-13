export type Tyre = "SOFT" | "MEDIUM" | "HARD";
export type Pace = "CONSERVE" | "BALANCED" | "PUSH";
export type RaceStatus = "ready" | "running" | "paused" | "finished";
export type UpgradeType = "aero" | "power" | "suspension" | "reliability";
export interface UpgradeModules { aero: number; power: number; suspension: number; reliability: number; }
export type UpgradeRarity = "COMMON" | "RARE" | "EPIC";
export interface UpgradeCard {
  id: string;
  title: string;
  subtitle: string;
  rarity: UpgradeRarity;
  description: string;
  effect: string;
  upgradeType?: UpgradeType;
  amount?: number;
  cashBonus?: number;
}
const UPGRADE_CARD_POOL: UpgradeCard[] = [
  { id: "front-wing", title: "Reprofiled Front Wing", subtitle: "AERO PACKAGE", rarity: "COMMON", description: "A cleaner front-wing profile gives the drivers more confidence through medium-speed corners.", effect: "Aerodynamics +1", upgradeType: "aero", amount: 1 },
  { id: "floor-edge", title: "Revised Floor Edge", subtitle: "AERO PACKAGE", rarity: "RARE", description: "A more stable underfloor platform unlocks a bigger step in cornering performance.", effect: "Aerodynamics +2", upgradeType: "aero", amount: 2 },
  { id: "active-flow", title: "Active Flow Concept", subtitle: "AERO PACKAGE", rarity: "EPIC", description: "A breakthrough airflow concept delivers an unusually large aerodynamic gain.", effect: "Aerodynamics +3", upgradeType: "aero", amount: 3 },
  { id: "energy-map", title: "Aggressive Energy Map", subtitle: "POWER UNIT", rarity: "COMMON", description: "Revised deployment gives the car a stronger launch and better acceleration.", effect: "Power unit +1", upgradeType: "power", amount: 1 },
  { id: "combustion", title: "Combustion Breakthrough", subtitle: "POWER UNIT", rarity: "RARE", description: "A promising combustion and deployment package adds a meaningful pace advantage.", effect: "Power unit +2", upgradeType: "power", amount: 2 },
  { id: "hybrid-leap", title: "Hybrid System Leap", subtitle: "POWER UNIT", rarity: "EPIC", description: "A major hybrid deployment discovery creates a substantial performance step.", effect: "Power unit +3", upgradeType: "power", amount: 3 },
  { id: "suspension-geometry", title: "Revised Suspension Geometry", subtitle: "MECHANICAL GRIP", rarity: "COMMON", description: "A revised kinematic setup helps keep the tyres in their working window.", effect: "Suspension +1", upgradeType: "suspension", amount: 1 },
  { id: "tyre-whisperer", title: "Tyre Whisperer Programme", subtitle: "MECHANICAL GRIP", rarity: "RARE", description: "Long-run analysis reveals a setup that is kinder to the tyres over a stint.", effect: "Suspension +2", upgradeType: "suspension", amount: 2 },
  { id: "compliance-test", title: "Endurance Test Rig", subtitle: "RELIABILITY", rarity: "COMMON", description: "More rigorous component testing catches weaknesses before they become race-day problems.", effect: "Reliability +1", upgradeType: "reliability", amount: 1 },
  { id: "cooling-loop", title: "Advanced Cooling Loop", subtitle: "RELIABILITY", rarity: "RARE", description: "Improved thermal management protects the car through long, demanding race stints.", effect: "Reliability +2", upgradeType: "reliability", amount: 2 },
  { id: "sponsor-windfall", title: "Sponsor Performance Bonus", subtitle: "COMMERCIAL WIN", rarity: "COMMON", description: "A sponsor rewards the team for completing the weekend and delivering useful exposure.", effect: "+RM250,000 team funds", cashBonus: 250000 },
  { id: "technical-partner", title: "Technical Partner Windfall", subtitle: "COMMERCIAL WIN", rarity: "RARE", description: "A technical partner offers extra funding after seeing the team's development potential.", effect: "+RM450,000 team funds", cashBonus: 450000 },
];
export function draftUpgradeCards(state: RaceState): UpgradeCard[] {
  const pool = [...UPGRADE_CARD_POOL];
  let seed = (state.seed ^ Math.imul(state.weekendNumber + 17, 2654435761)) >>> 0;
  const nextRandom = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected: UpgradeCard[] = [];
  const categories = new Set<string>();
  for (const card of pool) {
    const category = card.upgradeType ?? "commercial";
    if (selected.length < 3 && !categories.has(category)) { selected.push(card); categories.add(category); }
  }
  for (const card of pool) if (selected.length < 3 && !selected.some((item) => item.id === card.id)) selected.push(card);
  return selected;
}
export interface CarState {
  id: string;
  driver: string;
  team: string;
  teamColor: string;
  playerCar: boolean;
  progress: number;
  lapTime: number;
  tyre: Tyre;
  nextTyre: Tyre;
  tyreWear: number;
  fuel: number;
  pace: Pace;
  pitLap: number;
  pitStops: number;
  pitDelay: number;
  condition: number;
  lastLap: number;
  bestLap: number;
  finishTime: number | null;
  finished: boolean;
}
export interface RaceEvent { id: number; lap: number; message: string; kind: "info" | "pit" | "battle" | "warning" | "finish"; }
export interface RaceState {
  version: 1;
  status: RaceStatus;
  lap: number;
  totalLaps: number;
  elapsedSeconds: number;
  seed: number;
  eventSequence: number;
  cars: CarState[];
  events: RaceEvent[];
  cash: number;
  upgradeLevel: number;
  upgradeModules: UpgradeModules;
  weekendNumber: number;
}
const TYRE_PACE_FACTOR: Record<Tyre, number> = { SOFT: 0.985, MEDIUM: 1, HARD: 1.018 };
const TYRE_WEAR_RATE: Record<Tyre, number> = { SOFT: 1.4, MEDIUM: 1, HARD: 0.72 };
const PACE_FACTOR: Record<Pace, number> = { CONSERVE: 1.018, BALANCED: 1, PUSH: 0.982 };

function random(state: RaceState): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}
function addEvent(state: RaceState, message: string, kind: RaceEvent["kind"] = "info") {
  state.events.unshift({ id: ++state.eventSequence, lap: Math.min(state.lap, state.totalLaps), message, kind });
  state.events = state.events.slice(0, 14);
}
function makeCar(id: string, driver: string, team: string, teamColor: string, playerCar: boolean, progress: number, n: number): CarState {
  return {
    id, driver, team, teamColor, playerCar, progress, lapTime: 91.4 + n * 0.27,
    tyre: n % 3 === 0 ? "SOFT" : n % 3 === 1 ? "MEDIUM" : "HARD",
    nextTyre: n % 3 === 0 ? "MEDIUM" : "HARD",
    tyreWear: 0.04 + n * 0.012, fuel: 100, pace: "BALANCED", pitLap: playerCar ? 7 : 6 + n % 4,
    pitStops: 0, pitDelay: 0, condition: 100, lastLap: 0, bestLap: 0, finishTime: null, finished: false,
  };
}
export function createRace(seed = 8241, upgradeLevel = 0, cash = 2500000, weekendNumber = 1): RaceState {
  const state: RaceState = { version: 1, status: "ready", lap: 1, totalLaps: 18, elapsedSeconds: 0, seed, eventSequence: 0, cash, upgradeLevel, upgradeModules: { aero: 0, power: 0, suspension: 0, reliability: 0 }, weekendNumber, cars: [], events: [] };
  state.cars = [
    makeCar("rp-1", "Alex Mercer", "Redline GP", "#f04438", true, 0.025, 0),
    makeCar("rp-2", "Mika Tanaka", "Redline GP", "#f04438", true, 0, 1),
    makeCar("r-1", "Luca Moretti", "Vortex Racing", "#48a9a6", false, 0.018, 2),
    makeCar("r-2", "Noah Bennett", "Vortex Racing", "#48a9a6", false, 0, 3),
    makeCar("r-3", "Sofia Laurent", "Apex Motorsport", "#8b7cf6", false, 0.012, 4),
    makeCar("r-4", "Ethan Cole", "Apex Motorsport", "#8b7cf6", false, 0, 5),
    makeCar("r-5", "Yuki Sato", "Northstar", "#e4b45c", false, 0.006, 6),
    makeCar("r-6", "Oliver Reed", "Northstar", "#e4b45c", false, 0, 7),
    makeCar("r-7", "Amara Okafor", "Velocity Works", "#6d9dfc", false, 0.003, 8),
    makeCar("r-8", "Felix Weber", "Velocity Works", "#6d9dfc", false, 0, 9),
  ];
  addEvent(state, "Race control: formation complete. Ten cars ready.");
  addEvent(state, "Engineer: monitor tyre life around the middle stint.");
  return state;
}
export function stepRace(current: RaceState): RaceState {
  if (current.status !== "running") return current;
  const state: RaceState = structuredClone(current);
  state.elapsedSeconds += 5; // Condensed race time: five simulated seconds per real-time tick.
  const oldOrder = [...state.cars].sort((a, b) => b.progress - a.progress);
  const oldPositions = new Map(oldOrder.map((car, index) => [car.id, index]));
  const oldLap = state.lap;
  for (const car of state.cars) {
    if (car.finished) continue;
    if (car.pitDelay > 0) { car.pitDelay -= 1; car.fuel = Math.max(0, car.fuel - 0.08); continue; }
    const tyrePenalty = car.tyreWear > 0.82 ? (car.tyreWear - 0.82) * 13 : car.tyreWear > 0.58 ? (car.tyreWear - 0.58) * 5 : 0;
    const fuelPenalty = car.fuel < 8 ? 2.4 : (100 - car.fuel) * 0.009;
    const reliabilityPenalty = (100 - car.condition) * 0.025;
    const modules = state.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 };
    const upgradeBonus = car.playerCar ? modules.aero * 0.08 + modules.power * 0.12 : 0;
    const noise = (random(state) - 0.5) * 0.85;
    const lapSeconds = Math.max(85, car.lapTime * PACE_FACTOR[car.pace] * TYRE_PACE_FACTOR[car.tyre] + tyrePenalty + fuelPenalty + reliabilityPenalty - upgradeBonus + noise);
    car.lastLap = lapSeconds;
    car.bestLap = car.bestLap === 0 ? lapSeconds : Math.min(car.bestLap, lapSeconds);
    const previousProgress = car.progress;
    const progressDelta = 5 / lapSeconds;
    car.progress += progressDelta;
    const wearReduction = car.playerCar ? Math.max(0.65, 1 - (state.upgradeModules?.suspension ?? 0) * 0.06) : 1;
    car.tyreWear = Math.min(1, car.tyreWear + (car.pace === "PUSH" ? 0.095 : car.pace === "CONSERVE" ? 0.05 : 0.07) * TYRE_WEAR_RATE[car.tyre] * progressDelta * wearReduction);
    car.fuel = Math.max(0, car.fuel - (car.pace === "PUSH" ? 0.78 : car.pace === "CONSERVE" ? 0.53 : 0.65) * progressDelta);
    const reliabilityProtection = car.playerCar ? Math.min(0.75, (state.upgradeModules?.reliability ?? 0) * 0.005) : 0;
    car.condition = Math.max(62, car.condition - 0.002 * (1 - reliabilityProtection));
    if (Math.floor(car.progress) > Math.floor(previousProgress)) {
      const completedLap = Math.floor(car.progress);
      if (car.pitStops === 0 && completedLap >= car.pitLap && car.progress < state.totalLaps) {
        car.pitDelay = 2; car.pitStops += 1; car.tyreWear = 0.02;
        car.tyre = car.nextTyre;
        addEvent(state, car.playerCar ? car.driver + " pits for " + car.tyre.toLowerCase() + " tyres." : car.driver + " (" + car.team + ") pits.", "pit");
      }
      if (completedLap >= state.totalLaps) {
        car.finished = true; car.progress = state.totalLaps; car.finishTime = state.elapsedSeconds;
        addEvent(state, car.driver + " takes the chequered flag.", "finish");
      }
    }
  }
  const order = [...state.cars].sort((a, b) => b.progress - a.progress);
  for (const car of order.filter((item) => item.playerCar)) {
    const before = oldPositions.get(car.id);
    const after = order.findIndex((item) => item.id === car.id);
    if (before !== undefined && after < before) {
      const passed = oldOrder[before - 1];
      if (passed && passed.id !== car.id && Math.abs(passed.progress - car.progress) < 0.08) addEvent(state, car.driver + " gains a position in traffic.", "battle");
    }
  }
  const leader = order[0];
  state.lap = Math.min(state.totalLaps, Math.max(1, Math.floor(leader.progress) + 1));
  if (state.lap !== oldLap && state.lap <= state.totalLaps) addEvent(state, "Lap " + state.lap + " of " + state.totalLaps + " — " + leader.driver + " leads the field.");
  if (state.cars.every((car) => car.finished)) {
    state.status = "finished";
    state.cars.sort((a, b) => (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity));
    const firstPlayer = state.cars.findIndex((car) => car.playerCar) + 1;
    const payout = firstPlayer === 1 ? 1100000 : firstPlayer <= 3 ? 750000 : firstPlayer <= 6 ? 520000 : 350000;
    state.cash += payout;
    addEvent(state, "Race complete. Prize income added to the team budget.", "finish");
  }
  return state;
}
export function setDriverStrategy(state: RaceState, carId: string, patch: Partial<Pick<CarState, "pace" | "nextTyre" | "pitLap">>): RaceState {
  const next = structuredClone(state);
  const car = next.cars.find((item) => item.id === carId);
  if (!car || !car.playerCar || next.status === "finished") return state;
  Object.assign(car, patch);
  addEvent(next, "Strategy updated for " + car.driver + ".");
  return next;
}
export function upgradeCar(state: RaceState, cardId: string): RaceState {
  if (state.status !== "finished") return state;
  const card = draftUpgradeCards(state).find((item) => item.id === cardId);
  if (!card) return state;
  const next = structuredClone(state);
  next.upgradeModules ??= { aero: 0, power: 0, suspension: 0, reliability: 0 };
  if (card.upgradeType && card.amount) next.upgradeModules[card.upgradeType] += card.amount;
  if (card.cashBonus) next.cash += card.cashBonus;
  next.upgradeLevel += 1;
  next.weekendNumber += 1; next.status = "ready"; next.lap = 1; next.elapsedSeconds = 0;
  next.seed = (next.seed + 947) >>> 0; next.eventSequence = 0; next.events = [];
  const fresh = createRace(next.seed, next.upgradeLevel, next.cash, next.weekendNumber);
  next.cars = fresh.cars;
  next.cars.forEach((car) => { car.condition = Math.max(72, car.condition - (car.playerCar ? 2.5 : 0)); if (car.playerCar) { car.tyre = "MEDIUM"; car.nextTyre = "HARD"; car.tyreWear = 0.02; car.fuel = 100; car.pitLap = 7; } });
  addEvent(next, "Weekend " + (next.weekendNumber - 1) + ": drafted " + card.title + ". " + card.effect);
  return next;
}
export function standings(state: RaceState): CarState[] { return [...state.cars].sort((a, b) => { if (a.finished && b.finished) return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity); if (a.finished) return -1; if (b.finished) return 1; return b.progress - a.progress; }); }
export function formatLapTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  return minutes + ":" + (seconds % 60).toFixed(3).padStart(6, "0");
}
