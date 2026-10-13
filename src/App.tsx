import { useEffect, useMemo, useState } from "react";
import { buildSynergies, createRace, draftUpgradeCards, formatLapTime, setDriverStrategy, standings, stepRace, upgradeCar, type CarState, type Pace, type RaceState, type Tyre } from "./simulation";

const SAVE_KEY = "redline-paddock-prototype-v1";
const money = (amount: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(amount);
const pct = (value: number) => Math.round(value) + "%";
function loadRace(): RaceState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as RaceState;
      if (saved.version === 1 && Array.isArray(saved.cars) && saved.cars.length === 10) return { ...saved, upgradeModules: saved.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 } };
    }
  } catch { /* Ignore a damaged local save and start a new career. */ }
  return createRace();
}

const TRACK_POINTS = [
  [116, 174], [148, 174], [183, 174], [218, 174], [249, 174],
  [270, 172], [287, 166], [302, 156], [311, 144], [314, 132],
  [311, 122], [304, 115], [293, 111], [282, 109], [275, 103],
  [273, 94], [279, 85], [292, 78], [307, 71], [315, 61],
  [313, 51], [304, 43], [289, 37], [270, 33], [245, 30],
  [218, 29], [191, 30], [166, 33], [146, 39], [132, 48],
  [124, 59], [123, 69], [129, 78], [143, 84], [157, 88],
  [161, 95], [155, 102], [140, 107], [122, 111], [104, 118],
  [88, 128], [78, 140], [77, 151], [83, 160], [94, 167],
  [106, 171]
] as const;

const TRACK_PATH = TRACK_POINTS.map(([x, y], index) =>
  (index === 0 ? "M" : "L") + x + " " + y
).join(" ") + " Z";

const TRACK_SEGMENTS = TRACK_POINTS.map((point, index) => {
  const next = TRACK_POINTS[(index + 1) % TRACK_POINTS.length];
  return Math.hypot(next[0] - point[0], next[1] - point[1]);
});
const TRACK_LENGTH = TRACK_SEGMENTS.reduce((total, length) => total + length, 0);

function trackPosition(progress: number) {
  let distance = (((progress % 1) + 1) % 1) * TRACK_LENGTH;
  for (let index = 0; index < TRACK_POINTS.length; index++) {
    const a = TRACK_POINTS[index];
    const b = TRACK_POINTS[(index + 1) % TRACK_POINTS.length];
    const segmentLength = TRACK_SEGMENTS[index];
    if (distance <= segmentLength || index === TRACK_POINTS.length - 1) {
      const fraction = segmentLength === 0 ? 0 : distance / segmentLength;
      return {
        x: a[0] + (b[0] - a[0]) * fraction,
        y: a[1] + (b[1] - a[1]) * fraction,
      };
    }
    distance -= segmentLength;
  }
  return { x: TRACK_POINTS[0][0], y: TRACK_POINTS[0][1] };
}

function CircuitMap({ cars, lap }: { cars: CarState[]; lap: number }) {
  const points = useMemo(() => cars.map((car) => ({
    ...car,
    ...trackPosition(car.progress),
  })), [cars]);
  return <div className="circuit-wrap">
    <svg viewBox="0 0 380 220" role="img" aria-label="Schematic live circuit map showing each car on the track">
      <defs>
        <linearGradient id="track-surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34363d"/>
          <stop offset="100%" stopColor="#24262c"/>
        </linearGradient>
        <filter id="player-glow" x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>
      <path d={TRACK_PATH} fill="none" stroke="#111216" strokeWidth="39" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={TRACK_PATH} fill="none" stroke="#cfd1d6" strokeWidth="32" strokeDasharray="5 5" strokeLinecap="butt" strokeLinejoin="round" opacity=".82"/>
      <path d={TRACK_PATH} fill="none" stroke="url(#track-surface)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={TRACK_PATH} fill="none" stroke="#777b84" strokeWidth="1.2" strokeDasharray="4 6" opacity=".85"/>
      <path d="M274 180 C259 193 239 198 215 198 L137 198 Q119 198 116 183" fill="none" stroke="#141519" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M274 180 C259 193 239 198 215 198 L137 198 Q119 198 116 183" fill="none" stroke="#45474e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M274 180 C259 193 239 198 215 198 L137 198 Q119 198 116 183" fill="none" stroke="#92959d" strokeWidth=".8" strokeDasharray="3 4" opacity=".7"/>
      <rect x="167" y="185" width="31" height="9" rx="1.5" fill="#24262c" stroke="#62656d" strokeWidth=".8"/>
      <path d="M173 187 V192 M179 187 V192 M185 187 V192 M191 187 V192" stroke="#f04438" strokeWidth="1.3"/>
      <text x="204" y="191" className="track-pit-label">PIT LANE</text>
      <path d="M116 162 L116 186" stroke="#f5f5f5" strokeWidth="3" strokeLinecap="round"/>
      <path d="M111 162 L111 186 M121 162 L121 186" stroke="#f04438" strokeWidth="3" strokeLinecap="round"/>
      <text x="129" y="158" className="track-marker-label">START / FINISH</text>
      <g className="track-sector"><circle cx="295" cy="48" r="5"/><text x="295" y="50.5">1</text></g>
      <g className="track-sector"><circle cx="143" cy="87" r="5"/><text x="143" y="89.5">2</text></g>
      <g className="track-sector"><circle cx="80" cy="151" r="5"/><text x="80" y="153.5">3</text></g>
      <text x="190" y="105" textAnchor="middle" className="track-center-label">LAP {String(lap).padStart(2, "0")}</text>
      <text x="190" y="121" textAnchor="middle" className="track-center-sub">KUALA LUMPUR GP</text>
      <text x="190" y="137" textAnchor="middle" className="track-center-sub">LIVE TRACKING</text>
      {points.map((car) => <g key={car.id}>
        {car.playerCar && <circle cx={car.x} cy={car.y} r="10" fill={car.teamColor} opacity=".18" filter="url(#player-glow)"/>}
        {car.playerCar && <circle cx={car.x} cy={car.y} r="7" fill={car.teamColor} opacity=".22"/>}
        <circle cx={car.x} cy={car.y} r={car.playerCar ? 4.4 : 3.1} fill={car.teamColor} stroke={car.playerCar ? "#fff" : "#17181b"} strokeWidth={car.playerCar ? 1.3 : .8}/>
        {car.playerCar && <text x={car.x + 8} y={car.y - 7} className="track-car-label">{car.id === "rp-1" ? "07" : "22"}</text>}
      </g>)}
    </svg>
    <div className="map-legend"><span><i className="dot red"/> REDLINE</span><span><i className="dot teal"/> VORTEX</span><span><i className="dot purple"/> APEX</span><span><i className="dot gold"/> NORTHSTAR</span><span><i className="dot blue"/> VELOCITY</span></div>
  </div>;
}


function HeroCarGraphic() {
  return <div className="hero-art" aria-hidden="true">
    <div className="hero-art-glow" />
    <svg viewBox="0 0 520 190" role="presentation">
      <defs>
        <linearGradient id="hero-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff655b" />
          <stop offset="55%" stopColor="#d82d29" />
          <stop offset="100%" stopColor="#721c20" />
        </linearGradient>
        <linearGradient id="hero-carbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#41434a" />
          <stop offset="100%" stopColor="#17181c" />
        </linearGradient>
        <filter id="hero-shadow" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <g className="hero-speed-lines" stroke="#a9abb4" strokeWidth="1">
        <path d="M14 46 H147 M0 57 H117 M40 68 H132 M375 36 H503 M399 48 H520 M418 60 H487 M18 132 H113 M390 145 H500" />
      </g>
      <ellipse cx="272" cy="105" rx="172" ry="43" fill="#f04438" opacity=".18" filter="url(#hero-shadow)" />
      <g transform="translate(40 6) rotate(-7 220 90)">
        <path d="M54 90 L91 79 L145 78 L178 61 L252 53 L299 67 L353 72 L390 82 L390 103 L353 112 L299 118 L252 132 L178 125 L145 108 L91 108 Z" fill="url(#hero-carbon)" stroke="#777a83" strokeWidth="1.2"/>
        <path d="M143 82 L182 65 L252 59 L284 71 L273 90 L181 93 Z" fill="url(#hero-body)"/>
        <path d="M143 104 L182 121 L252 126 L284 114 L273 96 L181 94 Z" fill="#b32628"/>
        <path d="M184 78 L238 72 L256 88 L184 90 Z" fill="#1b2028" stroke="#a8c7d9" strokeWidth="1"/>
        <path d="M184 108 L238 115 L256 98 L184 96 Z" fill="#242a33" stroke="#a8c7d9" strokeWidth="1"/>
        <path d="M264 78 L305 80 L324 87 L305 92 L264 92 Z" fill="#f2f2f3"/>
        <path d="M264 106 L305 104 L324 97 L305 94 L264 94 Z" fill="#f2f2f3" opacity=".88"/>
        <path d="M89 79 L119 69 L142 73 L136 84 L91 89 Z" fill="#2a2b31" stroke="#777a83"/>
        <path d="M89 108 L119 118 L142 114 L136 103 L91 99 Z" fill="#2a2b31" stroke="#777a83"/>
        <path d="M44 78 L83 78 L83 91 L42 92 Z M44 108 L83 108 L83 95 L42 94 Z" fill="#17181c" stroke="#858891"/>
        <path d="M350 79 L393 74 L405 82 L403 91 L353 92 Z M350 109 L393 114 L405 106 L403 97 L353 95 Z" fill="#17181c" stroke="#858891"/>
        <path d="M159 87 L179 87 L179 99 L159 99 Z" fill="#f7d65b"/>
        <path d="M280 89 L335 89 L335 96 L280 96 Z" fill="#ffb2a9" opacity=".9"/>
        <g fill="#090a0d" stroke="#5b5d64" strokeWidth="2">
          <rect x="104" y="57" width="28" height="35" rx="5"/><rect x="104" y="97" width="28" height="35" rx="5"/>
          <rect x="325" y="55" width="28" height="35" rx="5"/><rect x="325" y="99" width="28" height="35" rx="5"/>
        </g>
        <g stroke="#7c7f87" strokeWidth="1.2"><path d="M110 65 H126 M110 73 H126 M110 111 H126 M110 119 H126 M331 63 H347 M331 71 H347 M331 107 H347 M331 115 H347"/></g>
        <path d="M173 92 L273 92 L286 95 L273 98 L173 98 Z" fill="#f04438"/>
        <path d="M190 94 H256" stroke="#fff" strokeWidth="1.3" opacity=".9"/>
      </g>
      <text x="258" y="177" textAnchor="middle" fill="#777a83" fontSize="8" letterSpacing="4" fontFamily="monospace">REDLINE GP · CHASSIS R-01</text>
    </svg>
    <div className="hero-art-caption"><span>01</span><i /> AERODYNAMIC PACKAGE <b>MK.I</b></div>
  </div>;
}

function DriverStrategy({ car, status, onPace, onTyre, onPitLap }: {
  car: CarState; status: RaceState["status"]; onPace: (pace: Pace) => void; onTyre: (tyre: Tyre) => void; onPitLap: (lap: number) => void;
}) {
  const disabled = status === "finished";
  return <div className="driver-strategy">
    <div className="driver-head"><span className="driver-number">{car.id === "rp-1" ? "07" : "22"}</span><div className="driver-ident"><strong>{car.driver}</strong><span>REDLINE GP · {car.id === "rp-1" ? "CAR 01" : "CAR 02"}</span></div><span className={"tyre-pill tyre-" + car.tyre.toLowerCase()}>{car.tyre[0]}</span></div>
    <div className="driver-metrics">
      <div><span>TYRE LIFE</span><strong>{pct((1 - car.tyreWear) * 100)}</strong><div className="meter"><i style={{ width: pct((1 - car.tyreWear) * 100) }}/></div></div>
      <div><span>FUEL LOAD</span><strong>{pct(car.fuel)}</strong><div className="meter fuel"><i style={{ width: pct(car.fuel) }}/></div></div>
    </div>
    <div className="strategy-label">PACE MODE</div>
    <div className="segmented">{(["CONSERVE", "BALANCED", "PUSH"] as Pace[]).map((pace) => <button key={pace} disabled={disabled} className={car.pace === pace ? "selected" : ""} onClick={() => onPace(pace)}>{pace}</button>)}</div>
    <div className="strategy-row">
      <label>Next tyre<select disabled={disabled} value={car.nextTyre} onChange={(e) => onTyre(e.target.value as Tyre)}><option value="SOFT">Soft</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
      <label>Pit target<select disabled={disabled} value={car.pitLap} onChange={(e) => onPitLap(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 3).map((lap) => <option key={lap} value={lap}>Lap {lap}</option>)}</select></label>
    </div>
  </div>;
}

export default function App() {
  const [race, setRace] = useState<RaceState>(() => loadRace());
  const [speed, setSpeed] = useState(1);
  const [savedAt, setSavedAt] = useState("LOCAL SAVE READY");
  const [showResults, setShowResults] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(race)); setSavedAt("SAVED LOCALLY · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); }
    catch { setSavedAt("LOCAL STORAGE UNAVAILABLE"); }
  }, [race]);
  useEffect(() => {
    if (race.status !== "running") return;
    const id = window.setInterval(() => setRace((current) => stepRace(current)), Math.max(120, 1000 / speed));
    return () => window.clearInterval(id);
  }, [race.status, speed]);
  const order = useMemo(() => standings(race), [race]);
  const finishedCount = race.cars.filter((car) => car.finished).length;
  const modules = race.upgradeModules ?? { aero: 0, power: 0, suspension: 0, reliability: 0 };
  const draftCards = useMemo(() => race.status === "finished" ? draftUpgradeCards(race) : [], [race.status, race.seed, race.weekendNumber]);
  const selectedDraft = draftCards.find((card) => card.id === selectedDraftId) ?? draftCards[0];
  const setStrategy = (car: CarState, patch: Partial<Pick<CarState, "pace" | "nextTyre" | "pitLap">>) => setRace((current) => setDriverStrategy(current, car.id, patch));
  const resetCareer = () => { if (window.confirm("Start a new career? Your current local career will be replaced.")) { setRace(createRace(Date.now() >>> 0)); setShowResults(false); } };
  const bestLap = Math.min(...race.cars.filter((car) => car.playerCar && car.bestLap > 0).map((car) => car.bestLap), Infinity);

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#" aria-label="Redline Paddock home"><span className="brand-mark"><i/><i/><i/></span><span className="brand-text">REDLINE<span>PADDOCK</span></span></a><nav className="main-nav"><span className="nav-active">OPERATIONS</span><span>ENGINEERING</span><span>CHAMPIONSHIP</span></nav><div className="top-status"><i className="status-dot"/> PROTOTYPE <b/> {savedAt}</div></header>
    <section className="page-heading"><div className="heading-copy"><div className="eyebrow">TEAM OPERATIONS <b>/</b> ROUND {String(race.weekendNumber).padStart(2, "0")}</div><h1>Race <em>Control.</em></h1><p>Every decision has a cost. Every lap is an opportunity.</p></div><HeroCarGraphic /><div className="weekend-status"><i className={"live-indicator " + (race.status === "running" ? "is-live" : "")}/><div><strong>{race.status === "running" ? "SESSION LIVE" : race.status === "finished" ? "SESSION COMPLETE" : race.status === "paused" ? "SESSION PAUSED" : "RACE WEEKEND"}</strong><span>KUALA LUMPUR INTERNATIONAL · FICTIONAL</span></div></div></section>
    <section className="stat-strip">
      <div className="stat-cell"><span>TEAM BUDGET</span><strong>{money(race.cash)}</strong><small>{race.upgradeLevel ? "PACKAGE LEVEL " + race.upgradeLevel : "INITIAL ALLOCATION"}</small></div>
      <div className="stat-cell"><span>CAR PERFORMANCE</span><strong>{Math.min(100, 82 + modules.aero * 2 + modules.power * 3 + modules.suspension + modules.reliability)}<small className="inline-unit"> / 100</small></strong><small>{race.upgradeLevel ? "DRAFTED SPEC" : "BASELINE SPEC"}</small></div>
      <div className="stat-cell"><span>RACE PROGRESS</span><strong>{Math.min(race.lap, race.totalLaps)}<small className="inline-unit"> / {race.totalLaps} LAPS</small></strong><small>{finishedCount}/10 CARS FINISHED</small></div>
      <div className="stat-cell"><span>YOUR BEST LAP</span><strong>{formatLapTime(bestLap)}</strong><small>SESSION TIMING</small></div>
    </section>
    <section className="build-intel" aria-label="Engineering build profile">
      <div className="build-intel-heading"><span>ENGINEERING PROFILE</span><b>{buildSynergies(modules).length === 1 ? "1 ACTIVE SYNERGY" : buildSynergies(modules).length + " ACTIVE SYNERGIES"}</b></div>
      <div className="build-intel-items">
        <div className="build-tradeoff"><strong>DEVELOPMENT TRADE-OFFS</strong><span>Aero increases tyre load · Power packages use more fuel</span></div>
        {buildSynergies(modules).length === 0 ? <div className="build-synergy-empty">No build synergy yet. Invest in two related departments to unlock a combined effect.</div> : buildSynergies(modules).map((synergy) => <div className="build-synergy" key={synergy}><strong>{synergy}</strong><span>{synergy === "AERO + POWER INTEGRATION" ? "Extra 0.10s pace per lap from a coordinated aero and power package." : "10% less tyre wear and component condition loss from an endurance-focused platform."}</span></div>)}
      </div>
    </section>
    <div className="content-grid">
      <section className="panel race-panel">
        <div className="panel-heading"><div><div className="section-kicker">LIVE TELEMETRY <i className="tiny-live"/></div><h2>Race overview</h2></div><div className="lap-badge">LAP <strong>{String(Math.min(race.lap, race.totalLaps)).padStart(2, "0")}</strong><span>/ {race.totalLaps}</span></div></div>
        <CircuitMap cars={race.cars} lap={race.lap}/>
        <div className="race-controls"><div className="control-left"><button className="primary-button" disabled={race.status === "finished"} onClick={() => setRace((current) => ({ ...current, status: current.status === "running" ? "paused" : "running" }))}><span>{race.status === "running" ? "Ⅱ" : "▶"}</span>{race.status === "running" ? "PAUSE" : race.status === "paused" ? "RESUME RACE" : "START RACE"}</button>{race.status === "running" && <span className="running-copy">● RACE RUNNING</span>}{race.status === "paused" && <span className="paused-copy">RACE PAUSED</span>}</div><div className="speed-control"><span>SIM SPEED</span>{[1, 2, 4].map((n) => <button key={n} className={speed === n ? "speed-active" : ""} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        {race.status === "finished" && <div className="finish-banner"><div><span className="section-kicker">CHEQUERED FLAG</span><h3>Race complete.</h3><p>Prize income and classification are ready for review.</p></div><button className="secondary-button" onClick={() => setShowResults(!showResults)}>{showResults ? "HIDE REPORT" : "VIEW RACE REPORT"} ↗</button></div>}
        {showResults && race.status === "finished" && <RaceReport race={race}/>}
      </section>
      <section className="panel standings-panel"><div className="panel-heading"><div><div className="section-kicker">TIMING TOWER</div><h2>Race classification</h2></div><span className="field-count">10 CARS</span></div>
        <div className="standings-table"><div className="table-header"><span>POS</span><span>DRIVER / TEAM</span><span>GAP</span><span>TYRE</span></div>
          {order.map((car, index) => <div className={"standings-row " + (car.playerCar ? "player-row" : "")} key={car.id}><span className="position">{String(index + 1).padStart(2, "0")}</span><span className="driver-cell"><i style={{ background: car.teamColor }}/><span><strong>{car.driver}</strong><small>{car.team}</small></span>{car.playerCar && <b className="you-tag">YOU</b>}</span><span className="gap-cell">{index === 0 ? "LEADER" : car.finished && order[0].finished ? "+" + ((car.finishTime ?? 0) - (order[0].finishTime ?? 0)).toFixed(1) + "s" : "+" + Math.max(0, (order[0].progress - car.progress) * 91.4).toFixed(1) + "s"}</span><span className={"tyre-mini tyre-" + car.tyre.toLowerCase()}>{car.tyre[0]}</span></div>)}
        </div><div className="standings-foot"><span><i className="dot red"/> REDLINE GP</span><span>POSITION UPDATES LIVE</span></div>
      </section>
      <section className="panel strategy-panel"><div className="panel-heading"><div><div className="section-kicker">PIT WALL</div><h2>Driver strategy</h2></div><span className="strategy-count">02 CARS</span></div>
        <div className="strategy-grid">{race.cars.filter((car) => car.playerCar).map((car) => <DriverStrategy key={car.id} car={car} status={race.status} onPace={(pace) => setStrategy(car, { pace })} onTyre={(nextTyre) => setStrategy(car, { nextTyre })} onPitLap={(pitLap) => setStrategy(car, { pitLap })}/>)}</div>
        <div className="engineer-note"><span className="engineer-icon">i</span><div><strong>ENGINEER'S NOTE</strong><p>{race.status === "finished" ? "Review the report, then fit an upgrade to prepare for the next weekend." : race.cars.some((car) => car.playerCar && car.tyreWear > .7) ? "Tyre wear is high. Consider conserving pace or adjusting the pit window." : "Tyre life is manageable. Watch degradation and avoid exposing both cars to the same strategy."}</p></div></div>
      </section>
      <section className="panel event-panel"><div className="panel-heading"><div><div className="section-kicker">RACE RADIO</div><h2>Event log</h2></div><span className="event-count">{race.events.length} EVENTS</span></div><div className="event-list">{race.events.slice(0, 8).map((item) => <div className="event-item" key={item.id}><span className={"event-marker marker-" + item.kind}>{item.kind === "pit" ? "P" : item.kind === "battle" ? "↗" : item.kind === "finish" ? "■" : "·"}</span><div><span className="event-lap">LAP {String(item.lap).padStart(2, "0")} · RACE CONTROL</span><p>{item.message}</p></div></div>)}</div></section>
      {race.status === "finished" && <section className="panel upgrade-panel roguelite-panel">
        <div className="upgrade-copy">
          <div className="section-kicker">ENGINEERING DEPARTMENT · POST-RACE DRAFT</div>
          <h2>Three leads. One breakthrough.</h2>
          <p>Your engineers have surfaced three opportunities from the weekend's data. Pick one to keep for the rest of your career. Offers are randomised each round, and rare breakthroughs can change your team's direction.</p>
          <div className="upgrade-meta"><span>TEAM BUDGET <b>{money(race.cash)}</b></span><span>DEVELOPMENT PICKS <b>{race.upgradeLevel}</b></span><span>ROUND COMPLETED <b>{String(race.weekendNumber).padStart(2, "0")}</b></span></div>
          <div className="rogue-draft-grid">
            {draftCards.map((card, index) => <button key={card.id} className={"rogue-card " + "rarity-" + card.rarity.toLowerCase() + (selectedDraft?.id === card.id ? " rogue-card-selected" : "")} onClick={() => setSelectedDraftId(card.id)}>
              <span className="rogue-card-top"><span className="rogue-card-index">0{index + 1} / OFFER</span><b>{card.rarity}</b></span>
              <span className="rogue-card-art">{card.upgradeType === "aero" ? "↗" : card.upgradeType === "power" ? "ϟ" : card.upgradeType === "suspension" ? "⌁" : card.upgradeType === "reliability" ? "◇" : "₥"}</span>
              <span className="rogue-card-subtitle">{card.subtitle}</span>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
              <span className="rogue-card-effect">{card.effect}</span>
              <span className="rogue-card-pick">{selectedDraft?.id === card.id ? "SELECTED ✓" : "SELECT THIS →"}</span>
            </button>)}
          </div>
          <p className="rogue-rule-note">One pick per race · Permanent career effects · Synergies reward focused development; performance has trade-offs</p>
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
