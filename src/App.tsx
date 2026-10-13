import { useEffect, useMemo, useState } from "react";
import { createRace, formatLapTime, setDriverStrategy, standings, stepRace, upgradeCar, type CarState, type Pace, type RaceState, type Tyre } from "./simulation";

const SAVE_KEY = "redline-paddock-prototype-v1";
const money = (amount: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(amount);
const pct = (value: number) => Math.round(value) + "%";
function loadRace(): RaceState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as RaceState;
      if (saved.version === 1 && Array.isArray(saved.cars) && saved.cars.length === 10) return saved;
    }
  } catch { /* Ignore a damaged local save and start a new career. */ }
  return createRace();
}

function CircuitMap({ cars, lap }: { cars: CarState[]; lap: number }) {
  const points = useMemo(() => cars.map((car, index) => {
    const angle = (car.progress % 1) * Math.PI * 2;
    return { ...car, x: 190 + Math.cos(angle) * 118 + (index % 2 ? 4 : -4), y: 110 + Math.sin(angle) * 63 + (index % 2 ? 3 : -3) };
  }), [cars]);
  return <div className="circuit-wrap">
    <svg viewBox="0 0 380 220" role="img" aria-label="Schematic live circuit map">
      <path d="M94 48 C126 18 229 26 272 49 C324 76 317 136 277 157 C243 175 251 192 203 187 C153 182 143 159 104 169 C54 181 37 132 55 93 C64 74 72 61 94 48 Z" fill="none" stroke="#24252a" strokeWidth="30" strokeLinecap="round"/>
      <path d="M94 48 C126 18 229 26 272 49 C324 76 317 136 277 157 C243 175 251 192 203 187 C153 182 143 159 104 169 C54 181 37 132 55 93 C64 74 72 61 94 48 Z" fill="none" stroke="#45474e" strokeWidth="22" strokeLinecap="round"/>
      <path d="M94 48 C126 18 229 26 272 49 C324 76 317 136 277 157 C243 175 251 192 203 187 C153 182 143 159 104 169 C54 181 37 132 55 93 C64 74 72 61 94 48 Z" fill="none" stroke="#8b8d94" strokeWidth="1" strokeDasharray="5 6" opacity=".65"/>
      <path d="M77 70 L93 57 M77 78 L99 60 M77 86 L105 63" stroke="#f5f5f5" strokeWidth="2" opacity=".7"/>
      <text x="190" y="108" textAnchor="middle" className="track-center-label">LAP {String(lap).padStart(2, "0")}</text>
      <text x="190" y="124" textAnchor="middle" className="track-center-sub">KUALA LUMPUR GP</text>
      {points.map((car) => <g key={car.id}>{car.playerCar && <circle cx={car.x} cy={car.y} r="8" fill={car.teamColor} opacity=".22"/>}<circle cx={car.x} cy={car.y} r={car.playerCar ? 4.5 : 3.2} fill={car.teamColor} stroke={car.playerCar ? "#fff" : "#17181b"} strokeWidth={car.playerCar ? 1.3 : .7}/></g>)}
    </svg>
    <div className="map-legend"><span><i className="dot red"/> REDLINE</span><span><i className="dot teal"/> VORTEX</span><span><i className="dot purple"/> APEX</span><span><i className="dot gold"/> NORTHSTAR</span><span><i className="dot blue"/> VELOCITY</span></div>
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
  const cost = 650000 + race.upgradeLevel * 250000;
  const setStrategy = (car: CarState, patch: Partial<Pick<CarState, "pace" | "nextTyre" | "pitLap">>) => setRace((current) => setDriverStrategy(current, car.id, patch));
  const resetCareer = () => { if (window.confirm("Start a new career? Your current local career will be replaced.")) { setRace(createRace(Date.now() >>> 0)); setShowResults(false); } };
  const bestLap = Math.min(...race.cars.filter((car) => car.playerCar && car.bestLap > 0).map((car) => car.bestLap), Infinity);

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#" aria-label="Redline Paddock home"><span className="brand-mark"><i/><i/><i/></span><span className="brand-text">REDLINE<span>PADDOCK</span></span></a><nav className="main-nav"><span className="nav-active">OPERATIONS</span><span>ENGINEERING</span><span>CHAMPIONSHIP</span></nav><div className="top-status"><i className="status-dot"/> PROTOTYPE <b/> {savedAt}</div></header>
    <section className="page-heading"><div><div className="eyebrow">TEAM OPERATIONS <b>/</b> ROUND {String(race.weekendNumber).padStart(2, "0")}</div><h1>Race <em>Control.</em></h1><p>Every decision has a cost. Every lap is an opportunity.</p></div><div className="weekend-status"><i className={"live-indicator " + (race.status === "running" ? "is-live" : "")}/><div><strong>{race.status === "running" ? "SESSION LIVE" : race.status === "finished" ? "SESSION COMPLETE" : race.status === "paused" ? "SESSION PAUSED" : "RACE WEEKEND"}</strong><span>KUALA LUMPUR INTERNATIONAL · FICTIONAL</span></div></div></section>
    <section className="stat-strip">
      <div className="stat-cell"><span>TEAM BUDGET</span><strong>{money(race.cash)}</strong><small>{race.upgradeLevel ? "PACKAGE LEVEL " + race.upgradeLevel : "INITIAL ALLOCATION"}</small></div>
      <div className="stat-cell"><span>CAR PERFORMANCE</span><strong>{82 + race.upgradeLevel * 3}<small className="inline-unit"> / 100</small></strong><small>{race.upgradeLevel ? "UPGRADED SPEC" : "BASELINE SPEC"}</small></div>
      <div className="stat-cell"><span>RACE PROGRESS</span><strong>{Math.min(race.lap, race.totalLaps)}<small className="inline-unit"> / {race.totalLaps} LAPS</small></strong><small>{finishedCount}/10 CARS FINISHED</small></div>
      <div className="stat-cell"><span>YOUR BEST LAP</span><strong>{formatLapTime(bestLap)}</strong><small>SESSION TIMING</small></div>
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
      {race.status === "finished" && <section className="panel upgrade-panel"><div className="upgrade-copy"><div className="section-kicker">ENGINEERING DEPARTMENT</div><h2>Bring the next package.</h2><p>Invest in a refined aerodynamic concept to improve pace at the next event. Upgrade effects are simplified for this prototype.</p><div className="upgrade-meta"><span>CURRENT LEVEL <b>{race.upgradeLevel}</b></span><span>PROJECT COST <b>{money(cost)}</b></span></div></div><div className="upgrade-action"><div className="upgrade-symbol">↗</div><strong>+0.16s</strong><span>ESTIMATED LAP PACE</span><button className="primary-button" disabled={race.cash < cost} onClick={() => { setRace((current) => upgradeCar(current)); setShowResults(false); }}>FIT UPGRADE · {money(cost)}</button><button className="text-button" onClick={resetCareer}>START NEW CAREER</button></div></section>}
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
