# Redline Paddock

> **Build your team. Engineer your future.**  
> A single-player idle motorsport management game built around long-term progression, strategic race control, and evolving rivals.

**Status:** Planning and design  
**Repository:** Private  
**Project type:** Independent game project — separate from Redline Grid

Redline Paddock is a motorsport management game inspired by the satisfying long-term progression of idle games such as *Melvor Idle*. Players build a team over time, develop drivers and technology, manage finances, and compete in race weekends. Most management systems progress while the player is away, while races remain a deliberate activity the player can return to and influence.

This README records the current design direction. Specific numbers, balance values, and features remain subject to iteration. No application implementation has started.

---

## Contents

- [Design pillars](#design-pillars)
- [Core gameplay loop](#core-gameplay-loop)
- [Idle and offline progression](#idle-and-offline-progression)
- [Race weekend and race control](#race-weekend-and-race-control)
- [Race simulation](#race-simulation)
- [Team development](#team-development)
- [Drivers and staff](#drivers-and-staff)
- [Rivals and AI](#rivals-and-ai)
- [Championship and finances](#championship-and-finances)
- [Presentation and UX](#presentation-and-ux)
- [Technical direction](#technical-direction)
- [Proposed project structure](#proposed-project-structure)
- [Testing and quality goals](#testing-and-quality-goals)
- [Development roadmap](#development-roadmap)
- [Open design decisions](#open-design-decisions)
- [Project boundaries](#project-boundaries)

---

## Design pillars

1. **Progress while away.** Research, training, and eligible management systems use elapsed time, not time spent staring at the game.
2. **Meaningful choices, not constant chores.** The player should be able to check in briefly, make decisions, queue work, and leave without feeling punished.
3. **Races are playable events.** Races run automatically by default, with optional hands-on strategy control when the player wants it.
4. **Trade-offs matter.** Faster development, reliability, cost, tyre life, and outright pace should compete with one another.
5. **Rivals evolve.** AI teams develop their cars, manage budgets, and change priorities over multiple seasons.
6. **Offline-first and single-player.** The core experience should not depend on a server, multiplayer service, or generative AI.
7. **Readable motorsport data.** Timing, strategy, car performance, and race events should be presented in a clear, information-rich interface that works on desktop and mobile.

## Core gameplay loop

1. Review the team's finances, staff, facilities, drivers, and championship position.
2. Start or queue research, training, engineering work, and facility upgrades.
3. Choose development priorities and accept the associated cost, time, and performance trade-offs.
4. Leave the game while eligible projects continue to progress.
5. Return to an offline progress report and review completed work, income, experience, and rival changes.
6. Prepare for qualifying and the race weekend.
7. Watch the race automatically or take control of selected strategic decisions.
8. Review results, championship points, finances, and the next development cycle.

## Idle and offline progression

Progression is planned across three time horizons:

| Horizon | Example activities |
| --- | --- |
| Short term — minutes to hours | Driver training, component analysis, pit crew drills, small engineering tasks |
| Medium term — hours to days | Aerodynamic packages, reliability programmes, facility upgrades, advanced driver development |
| Long term — weeks and seasons | Championship campaigns, young-driver development, major facility expansion, building a lasting team |

### Offline rules

- Projects advance using elapsed time.
- Completed work remains completed; progress is not wasted.
- Eligible follow-up projects may be queued when resources and capacity permit.
- Staff and facility capacity limit advanced programmes.
- Returning players receive a clear report of research completions, driver XP, sponsor income, operating costs, and notable rival developments.
- Being away should not trigger surprise firings, destroy progress, or make the career irrecoverable.
- AI rivals advance on a comparable elapsed-time basis.
- Research unlocks choices; it should not silently remove meaningful trade-offs.
- Race weekends and championship results wait for the player. An active race pauses when the game is closed unless the player has explicitly enabled automatic completion.

### Confirmed offline progression decisions

- **Offline progress cap:** Up to 72 hours of elapsed time are credited when the player returns.
- **Closing the game mid-race:** The active race pauses and can be resumed later; it does not finish offline.

Still to be specified and tested: clock/time-change handling, project queues, income limits, and the exact offline simulation rules.

## Race weekend and race control

The intended race experience combines a live 2D top-down circuit with a motorsport-style control interface.

### Planned race-control elements

- Circuit map with live car positions
- Timing tower and sector/lap information
- Driver and car status panels
- Tyre, fuel, damage, and reliability information
- Strategy console and pit-stop controls
- Engineer recommendations with estimates and confidence, not guaranteed answers
- Radio-style messages and a race event log
- Weather and race-control status
- Pause/resume and 1×, 2×, and 4× simulation speeds
- Automatic race running by default, with optional player intervention

The initial concept includes **11 fictional teams and 22 cars**, with the player managing one team and its two drivers. The other ten teams are AI rivals. This grid size and roster are initial design targets, not final balance commitments.

The first playable milestone should prove the race simulation on a simple circuit before the full management game is built around it.

## Race simulation

The simulation should be deterministic: the same initial state, random seed, and player commands should produce the same result. Rendering and UI code must not change race outcomes.

### Lap-time model

A conceptual model for lap time is:

`T_lap = T_base + Δ_tyre + Δ_fuel + Δ_traffic + Δ_weather + Δ_driver + Δ_setup + ε`

This is a design model rather than a final calibrated formula. Each term will be refined through testing and balancing.

### Car characteristics

Planned performance and reliability characteristics include:

- Aerodynamic efficiency and downforce
- Mechanical grip and chassis balance
- Power delivery and energy deployment
- Vehicle weight
- Reliability
- Tyre management

### Tyres and fuel

- Dry compounds: Soft, Medium, and Hard
- Wet-weather compounds: Intermediate and Wet
- Tyre state tracks compound, wear, temperature, and age.
- Degradation can move through normal, high, and critical regimes.
- Fuel weight and consumption affect pace.
- Driver pace modes include conserving, balanced running, and pushing.

Tyre behaviour should make compound choice, stint length, temperature, and race conditions strategically relevant.

### Traffic, overtaking, and pit stops

Overtaking should consider the gap, closing speed, tyre condition, dirty air, driver racecraft, circuit characteristics, and any circuit-specific overtaking assistance.

The planned pit-stop flow is:

1. Racing
2. Pit request accepted
3. Pit-lane entry
4. Tyre service
5. Pit exit and merge
6. Return to racing

Pit loss should account for lane time, service time, merging, and traffic. The simulation must handle overlapping pit requests and cars rejoining safely.

### Weather and incidents

Planned race conditions and events include changing weather, yellow flags, safety cars, virtual safety cars, red flags, spins, penalties, damage, mechanical problems, and retirements. Their frequency and impact must be tuned using scenario tests rather than arbitrary rates.

### Player commands

Potential commands include:

- Conserve, Balanced, Push, and Attack pace
- Defend or target a rival
- Let a teammate through or hold position
- Pit at the next opportunity
- Select a tyre compound
- Review strategy advice

The final command set and how it interacts with automatic racing remain to be defined.

## Team development

Development uses a **hybrid model**:

- **Automatic, low-maintenance projects** provide a simple path for routine progression.
- **Advanced engineering programmes** let the player allocate staff, manage facility capacity, and choose design trade-offs.

Advanced programmes may optimise cost, reliability, performance, and development time differently. There should not be one universally correct upgrade path.

### Planned departments and specialisations

| Department | Focus |
| --- | --- |
| Aerodynamics | Wings, floor development, aerodynamic efficiency |
| Vehicle Engineering | Chassis balance, mechanical grip, setup quality |
| Powertrain | Acceleration, energy deployment, efficiency |
| Reliability | Mechanical failure risk and repair costs |
| Tyre Engineering | Tyre life and temperature management |
| Pit Crew | Pit-stop speed and consistency |
| Driver Academy | Pace, consistency, racecraft, wet-weather ability |
| Race Strategy | Forecast interpretation and decision support |

Departments can gain experience, level up, unlock projects, and reach mastery milestones. Progression should introduce new options and specialisations rather than only adding flat stat bonuses.

## Drivers and staff

Driver attributes are planned on a 0–100 scale and may include:

- Raw pace
- Racecraft
- Consistency
- Tyre management
- Wet-weather skill
- Technical feedback
- Confidence

Driver development should take time and present choices. Young-driver development and long-term staff or driver planning are part of the career layer, with details to be finalised.

## Rivals and AI

Rival teams should evolve across seasons rather than remain static opponents. They may adjust:

- Car development and technical priorities
- Budgets and spending
- Driver and staff choices
- Research and facility investment
- Tyre and pit strategy
- Risk tolerance based on race and championship context

Planned AI archetypes include **Frontrunner**, **Opportunist**, **Aggressor**, and **Weather Gambler**.

Race AI should evaluate pit loss, tyre wear, traffic, weather forecasts, championship position, fuel, and reliability. It must not know future weather or use information unavailable to the player. Rival development should follow the same general elapsed-time principle as the player's development.

The AI will use deterministic game logic and rules, not a generative AI service, so the game remains usable offline.

## Championship and finances

The career layer is expected to include qualifying, race results, championship points and standings, sponsor payments, prize money, salaries, research and upgrade costs, repairs, and facility operating costs.

A finance ledger should make income and expenditure understandable. The player should be able to identify why the team gained or lost money and plan for upcoming commitments.

The first career prototype is tentatively planned around a six-race season. The final calendar, points system, contract rules, sponsor terms, and financial balance are still open for design.

## Presentation and UX

The interface should feel like a focused motorsport engineering workstation:

- Dark charcoal and near-black surfaces
- Restrained racing-red accents
- Technical, readable typography
- Compact panels, timing displays, and data visualisations
- Clear status hierarchy and useful tooltips
- Responsive desktop and mobile layouts
- Touch-friendly controls for race strategy
- An offline progress summary that is easy to scan

The visual direction may take inspiration from Redline Grid, but **Redline Paddock is a separate project with its own codebase and identity**.

## Technical direction

The current proposed stack is:

- **React + TypeScript + Vite** for the application
- **Canvas** for the 2D circuit and car rendering
- **Web Worker** for the simulation engine
- **IndexedDB** for career and race saves
- **Progressive Web App (PWA)** support for caching the application shell and essential assets

These are planning choices and may be adjusted after the simulation proof of concept.

### Architecture principles

- Keep the simulation engine independent from React and UI components.
- The UI sends commands and renders state; the simulation owns the authoritative game state.
- Use a fixed simulation timestep (initial target: 0.1 simulated seconds) independently of rendering speed.
- Use seeded, stateful random-number generation for reproducibility.
- Keep career, race simulation, rendering, and persistence separated.
- Validate saves and version the save schema so it can evolve safely.
- Autosave at safe points and preserve a recoverable save before replacing data.
- Support offline use without requiring cloud accounts.

### Save and resume

The save model is expected to include a schema version, save identifier, save timestamp, career state, and active race snapshot.

A mid-race save must capture enough state to resume consistently, including:

- Random-number generator state
- All cars and their positions
- Tyre and fuel state
- Pit operations
- Weather and race-control state
- AI decision state
- Pending player commands and command sequence numbers

Save/load and mid-race resume must be tested for deterministic consistency. Corrupt-save recovery and schema migration are also important quality goals.

## Proposed project structure

The following is a starting point for future implementation, not a created source tree:

```text
src/
  app/
  components/
    race-control/
    circuit-map/
    timing-tower/
    strategy-console/
    management/
  simulation/
    engine/
    physics/
    tyres/
    weather/
    pit-stops/
    incidents/
    ai/
    scoring/
  career/
    finances/
    development/
    contracts/
    championship/
  data/
    teams/
    drivers/
    circuits/
  persistence/
  workers/
  styles/
tests/
  unit/
  simulation/
  integration/
  e2e/
```

## Testing and quality goals

Testing should cover both software correctness and racing behaviour.

- Unit tests for lap-time components, tyre behaviour, pit loss, scoring, and finance calculations
- Determinism tests using fixed seeds and identical command sequences
- Scenario tests for dry races, rain, safety cars, failures, overlapping pit stops, penalties, and close finishes
- Save/load and mid-race resume consistency tests
- End-to-end checks for core UI flows, offline use, and mobile layouts
- Large batches of seeded races to evaluate pace variance, tyre degradation, pit loss, overtaking, incident frequency, and strategy effectiveness
- AI behaviour checks to ensure rivals use plausible strategies and do not receive future information

### Initial acceptance goals

- A complete 22-car race can finish without invalid simulation state.
- Tyres, pits, traffic, weather, and driver attributes can meaningfully affect outcomes.
- The two player drivers can receive separate strategic commands.
- AI teams exhibit recognisable strategy profiles.
- The race can be paused, sped up, saved, and resumed reliably.
- Core management progression continues offline.
- The interface remains usable on mobile.
- Save corruption or older save versions can be handled safely.

## Development roadmap

### Phase 1 — Simulation proof of concept
- Build a headless simulation with a simple circuit and 22 cars.
- Implement lap timing, basic tyre wear, overtaking, and race classification.
- Establish seeded determinism and automated tests.

### Phase 2 — Interactive race control
- Add the circuit map, timing tower, and driver/car status.
- Add player control for both team cars.
- Implement pace commands, pit requests, pause/resume, and simulation speed controls.

### Phase 3 — Race depth
- Add weather, AI strategy, safety cars, incidents, penalties, and event/radio messages.
- Balance and test different race scenarios.

### Phase 4 — Persistence and offline support
- Implement versioned local saves and safe autosaving.
- Support mid-race resume and offline application caching.
- Test deterministic save/load behaviour and recovery.

### Phase 5 — Career management
- Add qualifying, finances, development projects, contracts, and championship standings.
- Build the initial six-race career prototype.
- Add offline progression reports and evolving rival teams.

### Phase 6 — Balance and polish
- Run large seeded race batches and tune the simulation.
- Improve accessibility, responsive layouts, and feedback.
- Review onboarding, save recovery, and overall progression pacing.

The race engine should be proven before investing heavily in the full management layer or polished presentation.

### Confirmed race weekend decision

- **Weekend format:** Full weekend — FP1, FP2, FP3, qualifying, and the race.
- **Practice behaviour:** Optional. The player can run a practice session or skip it.

Practice should provide useful setup, tyre, and car-behaviour information, while skipping it should keep the career moving without forcing repetitive sessions.

### Confirmed economy decision

- **Economy difficulty:** Balanced. Budgets and upgrade costs matter, but careful management should make sustainable progress achievable.
- **Financial failure:** Recovery system. If the team runs out of money, emergency funding, spending cuts, and recovery objectives provide a path back instead of immediately ending the career.

The detailed income rates, contract terms, debt rules, and recovery objectives remain to be balanced during prototyping.

### Confirmed rival AI decision

- **Rival progression:** Independent simulation. Each rival team develops according to its own resources, priorities, strengths, weaknesses, and decisions. No hidden rubber-banding or secret performance boosts.
- **Career difficulty:** Player-selectable Casual, Standard, and Challenging presets. Presets should adjust starting conditions and/or AI decision quality transparently, without changing race outcomes behind the player's back.

The exact preset effects and rival decision algorithms remain to be designed and tested.

### Confirmed race-control decision

- **Race-control style:** Hybrid control. Cars race automatically, while the player can issue strategic commands during the race.
- **Automatic strategy:** Driving is automatic, but pit decisions and tyre choices remain under player control. Optional engineer advice can support decisions without guaranteeing outcomes.

The exact command timing, command priority, and pit-request rules will be defined during simulation design.

### Confirmed championship structure decision

- **Season length:** Start with a six-race season, then unlock 10-, 16-, and 20-race seasons as the career progresses.
- **Circuit calendar:** Fixed calendar order, so players can plan development around upcoming circuit characteristics and compare seasons consistently.

The unlock conditions, exact circuit roster, and race spacing remain to be specified.

### Confirmed driver market and development decision

- **Driver market:** A living market with expiring contracts, transfers, retirements, and new fictional prospects entering over time. AI teams make their own roster decisions based on their needs and circumstances.
- **Driver development:** An active youth academy where the player can scout prospects, invest in training, and decide when to promote them to a race seat.

Contract economics, driver generation, scouting uncertainty, development rates, and promotion requirements remain to be designed.

### Confirmed career entry decision

- **Career entry:** The player creates a new team with a custom identity. The team occupies one of 11 grid entries alongside 10 AI rival teams.
- **Starting strength:** Midfield newcomer, with a modest budget and developing facilities. The opening career should offer meaningful decisions and room to grow without making early progress feel hopeless.

Team naming and visual customisation, starting driver choices, initial car specification, and exact starting budgets remain to be designed.

### Confirmed team customisation decision

- **Team identity:** Full identity customisation, including team name, abbreviation, primary and secondary colours, preset logo, car livery, and driver suit colours.
- **Consistency:** The chosen identity should appear consistently throughout the game, including race visuals, timing tower, driver panels, team screens, and championship standings.

Detailed livery editing and custom logo uploads are not included in this decision; the initial approach uses preset visual assets and configurable colours.

### Confirmed sponsorship decision

- **Sponsorship model:** Contract-based offers with different payment levels, contract lengths, and performance requirements. The quality and availability of offers are influenced by team reputation.
- **Sponsor objectives:** A mixed set of objectives covering race results, race reliability, facility development, promising driver signings, and team reputation.
- **Career balance:** Developing teams should have viable routes to sponsorship through consistent progress and reliability, not only wins or podiums.

Exact contract terms, objective scoring, payment schedules, and consequences for missed targets remain to be balanced.

### Confirmed staff management decision

- **Staff management:** Department-level management. Hire department heads and specialists, manage salaries and assignments, and use staff skills to influence department performance.
- **Staff progression:** Staff gain experience and improve their skills over time. As their expertise and reputation grow, they may demand higher salaries or become harder to retain.
- **Management goal:** Keep staffing strategically meaningful without requiring constant micromanagement of every individual task.

Exact staff roles, skill categories, experience curves, salary progression, and retention mechanics remain to be designed.

### Confirmed championship scoring and sprint decision

- **Championship scoring:** Use a modern F1-inspired points system, with points awarded to the top 10 finishers.
- **Championships:** Track both the Drivers' Championship and Constructors' Championship.
- **Sprint format:** Selected rounds feature sprint qualifying and a shorter sprint race, adding extra sporting and strategic opportunities.
- **Rules still to define:** Exact points values, sprint points, sprint-round selection, classification requirements, penalties, fastest-lap treatment, and championship tie-breakers.

### Confirmed technical regulation decision

- **Regulation cycle:** Technical regulations change periodically every few seasons, with advance notice so the player can plan research, spending, facilities, and car development.
- **Impact on existing development:** Moderate. Some components and engineering advantages lose effectiveness under new rules, while facilities, staff, accumulated knowledge, and most career progress retain value.
- **Design goal:** Create meaningful changes in engineering priorities without making players feel that their long-term investments have been erased.

The exact regulation interval, rule packages, transition timing, and component-specific effects remain to be designed.

### Confirmed race distance and time-control decision

- **Race distance:** Condensed races that preserve meaningful tyre degradation, fuel decisions, pit stops, and safety-car possibilities.
- **Race time controls:** Players can pause, resume, and switch between 1×, 2×, and 4× simulation speed.
- **Design goal:** Make races strategically engaging without requiring players to watch every lap in real time. Exact lap counts and race durations will be tuned through simulation testing.

### Confirmed sporting setbacks and post-race analysis decision

- **Sporting setbacks:** Poor results can reduce reputation, weaken future sponsor offers, and tighten finances. Players retain a path to recovery through better management and gradual rebuilding rather than being trapped in an unrecoverable spiral.
- **Post-race reporting:** Provide detailed performance analysis explaining time lost through tyre choices and degradation, pace, pit timing, traffic, reliability, incidents, and car weaknesses.
- **Design goal:** Results should have meaningful consequences, while clear explanations help players learn from setbacks and make better decisions in future races.

The exact reputation changes, sponsor reactions, recovery pacing, and attribution of lap-time losses remain to be balanced and validated.

### Confirmed save system decision

- **Save model:** Local-first browser saves with automatic saving, plus exportable backups that players can restore later. The game should remain playable offline and should not require an account.
- **Career slots:** Support multiple independent career slots so players can maintain separate teams and experiments without overwriting their main career.
- **Data protection:** Make destructive actions explicit, validate imported backups, and provide clear warnings before deleting a career or replacing saved data.

The exact autosave cadence, backup file format, save migrations, and recovery behavior remain to be specified during implementation planning.

### Confirmed monetisation decision

- **Monetisation:** The game is free, with no monetisation, advertising, subscriptions, paid progression, or pay-to-win mechanics.
- **Future content:** No paid add-ons. Future improvements and additional content should be included for players without extra charges.
- **Design principle:** Progression, offline gains, race strategy, and career recovery must never be tuned to pressure players into spending money.

Distribution and hosting costs, if any, should be considered separately without changing this no-monetisation commitment.

### Confirmed long-term management automation decision

- **Management style:** Hybrid automation. The player sets priorities and launches important projects, while staff handle routine work.
- **Convenience features:** Optional repeat queues and configurable automation rules reduce repetitive tasks without removing meaningful decisions from the player.
- **Design principle:** Automation should be transparent and configurable. The player can understand what the team is doing, why it is doing it, and which budget or capacity limits apply.

Exact automation rules, project queue limits, staff authority, and player override behavior remain to be designed.

### Confirmed research and development capacity decision

- **Concurrent project capacity:** Facility-based. Facilities determine how many research and development projects can run at the same time.
- **Progression:** Facility upgrades unlock additional concurrent project capacity, giving infrastructure investment lasting strategic value.
- **Staff contribution:** Staff skills and assignments influence project speed and quality, but do not replace facility capacity.
- **Queue behavior:** Projects may wait in a queue until capacity becomes available, working with the hybrid automation model.

Exact capacity values, facility upgrade costs, department-specific restrictions, and queue priority rules remain to be designed and balanced.

### Confirmed long-term career progression decision

- **Career model:** Endless career. The player continues managing the same team across seasons, with no forced reset.
- **Evolving world:** Rival teams continue developing, technical regulations change over time, and new fictional drivers enter the market.
- **Persistence:** Long-term team progress, facilities, staff development, reputation, and career history remain part of the same save as the team evolves.
- **Player choice:** Multiple save slots still allow players to start separate careers, but starting over is never required to continue progressing.

Long-term balancing must keep later seasons interesting without relying on forced resets. Endgame rival evolution, regulation cadence, and performance ceilings remain to be designed.

### Confirmed qualifying format decision

- **Format:** Full knockout qualifying across Q1, Q2, and Q3.
- **Elimination:** The slowest drivers are eliminated at the end of each phase, with the remaining drivers advancing until the final phase determines the leading grid positions.
- **Design goal:** Preserve the sporting drama and strategic opportunities of a multi-phase qualifying session while keeping each phase condensed for the idle-management format.

Exact phase durations, elimination counts, tyre rules, and sprint-weekend qualifying variations remain to be defined.

### Confirmed sprint weekend format decision

- **Sprint grid:** A dedicated, condensed Sprint Shootout determines the starting order for the sprint race.
- **Sprint race:** The sprint is a shorter race with its own sporting and strategic decisions.
- **Grand Prix grid:** The sprint result determines the starting grid for the main Grand Prix.
- **Design goal:** Give sprint weekends a distinct identity and make sprint performance consequential, while keeping the shootout shorter than regular Q1–Q3 qualifying.

The exact shootout phases, elimination counts, sprint distance, points allocation, and treatment of penalties or unclassified sprint results remain to be defined.

### Confirmed pit-stop control decision

- **Pit planning:** The player sets a target lap or pit window and chooses the next tyre compound.
- **Execution:** The car executes the planned stop when conditions permit, subject to valid pit-entry rules and race circumstances.
- **Revisions:** The player can revise the plan before the pit commitment point. Once committed, the stop follows the pit-operation state machine.
- **Design goal:** Make strategy deliberate and readable at every simulation speed, including 4×, without requiring constant lap-by-lap monitoring.

The exact commitment point, pit-window behavior under safety cars or changing weather, and rules for conflicting queued commands remain to be defined.

### Confirmed individual driver strategy decision

- **Control model:** Each driver has an independent race strategy.
- **Per-car controls:** Each car has its own pace mode, tyre choice, pit window, and tactical commands.
- **Strategic flexibility:** The player can split strategies when the drivers have different race positions, tyre conditions, traffic, or tactical objectives.
- **Design goal:** Preserve meaningful two-car team management without requiring constant micromanagement; shared strategy templates may be considered later as a convenience feature.

The exact command set, conflict handling, and per-driver strategy interface remain to be defined.

### Confirmed team orders and teammate cooperation decision

- **Cooperation model:** Personality-driven. Drivers interpret team orders according to their traits, confidence, rivalry, and championship position.
- **Behavior:** Drivers may cooperate readily, hesitate, or resist instructions depending on the context and their individual characteristics.
- **Design goal:** Make teammate relationships and team orders strategically meaningful without making every instruction deterministic or requiring constant intervention.
- **Player control:** The player can still issue tactical commands; the outcome and its effects on morale, confidence, and team harmony depend on the driver and situation.

The exact personality traits, order-resolution rules, morale effects, and fairness/balance safeguards remain to be designed.

### Confirmed race incident severity decision

- **Severity model:** Balanced, risk-based incidents. Most races should run normally, while aggressive driving, poor conditions, traffic, and low reliability increase incident risk.
- **Consequences:** Serious incidents are uncommon but consequential, potentially involving significant time loss, damage, penalties, or retirement.
- **Explainability:** Post-race reports should explain contributing factors and distinguish preventable risk from unavoidable bad luck.
- **Player agency:** Car reliability, driver development, race strategy, and sensible risk management should provide ways to reduce exposure without eliminating all uncertainty.

Exact probabilities, damage states, repair costs, penalty rules, and retirement thresholds remain to be tuned through simulation testing.

### Confirmed weather forecasting decision

- **Weather information:** Show current track conditions alongside forecasts of expected changes and estimated timing.
- **Uncertainty:** Forecasts include confidence levels and can be wrong; they are guidance rather than guarantees.
- **Strategic impact:** Players can prepare for likely weather changes, but must weigh the cost of acting early against waiting for stronger evidence.
- **Design goal:** Make weather information useful for planning without making future conditions perfectly predictable.

The exact forecast horizon, confidence calculation, update frequency, engineer integration, and weather-transition model remain to be designed.

### Confirmed tyre rules and mandatory pit-stop decision

- **Dry Grand Prix rule:** Drivers must use at least two different dry tyre compounds and normally complete at least one pit stop.
- **Wet-weather exceptions:** The mandatory dry-compound requirement does not apply when wet-weather tyre use makes the dry-compound rule inapplicable under the game's sporting regulations.
- **Sprint races:** Use a simpler, separately defined tyre rule set suited to the shorter race.
- **Strategic purpose:** Preserve meaningful Soft, Medium, and Hard compound trade-offs, tyre degradation, and pit-window planning without adding unnecessary rule complexity.

Exact tyre allocations, sprint requirements, classification conditions, and the detailed wet-weather exception logic remain to be defined.

### Confirmed fuel strategy decision

- **Starting fuel:** The player chooses each driver's starting fuel load within safe limits.
- **Fuel and pace:** Less fuel reduces car weight and can improve pace, but leaves less margin for aggressive fuel use or unexpected race conditions.
- **In-race refuelling:** Refuelling is not allowed during a race.
- **Race control:** The player manages fuel consumption with the existing conserve, balanced, and push pace modes, weighing lap time against the risk of running short.

Exact fuel limits, consumption rates, reserve requirements, and how safety cars or race-distance changes affect estimates remain to be balanced.

### Confirmed car setup decision

- **Setup depth:** Use a focused engineering setup with a small number of meaningful adjustments rather than only presets or a highly complex engineering model.
- **Setup parameters:** Initial candidates include aero balance, ride height, suspension stiffness, and brake bias.
- **Trade-offs:** Adjustments affect competing performance characteristics, so there is no universally perfect setup for every circuit or condition.
- **Practice feedback:** Practice sessions provide information that helps players refine the setup. Skipping practice leaves a usable baseline setup available, but sacrifices some learning and optimisation opportunities.

Exact parameter ranges, interactions, driver feedback, setup recommendations, and circuit-specific effects remain to be designed and balanced.

### Confirmed setup change rules

- **Parc fermé-style lock:** Players may tune car setup during practice, but setup locks when qualifying begins.
- **After lock-in:** Setup changes are restricted for the remainder of the weekend, making practice preparation and weather forecasts important.
- **Design intent:** Preserve meaningful setup commitment without making the weekend cumbersome; any exceptional permitted changes and their effects must be specified in the sporting rules.

Exact permitted exceptions, sprint-weekend handling, and whether damage repairs can affect setup components remain to be defined.

### Confirmed car damage and repair decision

- **Managed repair queue:** Damage repairs consume both time and money rather than always completing instantly.
- **Player control:** Players can prioritise urgent repairs, allocate engineering capacity, and choose whether damaged components should be repaired or replaced.
- **Routine automation:** Staff may automatically handle routine repair work under the team's automation settings.
- **Strategic consequences:** Repair decisions must balance cost, available capacity, reliability, and readiness for upcoming race weekends.

Exact damage categories, repair durations, replacement inventory, capacity interactions, and automation thresholds remain to be designed and balanced.

### Confirmed spare-parts and replacement decision

- **Strategic spare inventory:** The team maintains limited stock of important car components rather than having unlimited instant replacements.
- **Manufacturing lead time:** Replacements may take time to manufacture, so players must plan inventory around expected risks and upcoming race weekends.
- **Management integration:** Spare stock connects reliability, R&D/manufacturing capacity, repair queues, and finances.
- **Design goal:** Inventory should create meaningful preparation and risk-management decisions without becoming a tedious warehouse-management system.

Exact component categories, inventory limits, storage costs, manufacturing lead times, and rules for using older specifications remain to be designed.

### Confirmed car upgrade manufacturing decision

- **Manufacture and install per car:** R&D completes a design, but components must then be manufactured and installed on each race car.
- **Limited production capacity:** Manufacturing capacity constrains how quickly components can be produced, so players may need to prioritise one car over the other.
- **Management integration:** Production connects R&D, engineering capacity, spare inventory, repair needs, and race-weekend preparation.
- **Strategic purpose:** A new design does not automatically upgrade the whole team; players make deliberate allocation decisions.

Exact production slots, component costs, installation time, compatibility rules, and whether old-spec parts can be reused remain to be designed.

### Confirmed component installation timing

- **Between race weekends:** Newly manufactured components are installed during the gap between Grand Prix weekends.
- **Planning requirement:** Players must schedule production and installation deadlines and prioritise which car receives each available upgrade before the next event.
- **Race-weekend focus:** New components are not installed during an active Grand Prix weekend; setup, qualifying, and race strategy remain the focus of the event.
- **Integration:** This rule works with per-car manufacturing, limited production capacity, spare inventory, and the parc fermé-style setup lock.

Exact installation duration, the treatment of emergency repairs, and how unusually short gaps affect unfinished work remain to be defined.

### Confirmed car development progression

- **Hybrid development tree:** Routine incremental upgrades improve existing engineering concepts, while breakthrough projects unlock alternative designs with distinct performance trade-offs.
- **Strategic variety:** Engineering directions may favour different characteristics, such as high downforce for technical circuits or low drag for circuits with long straights.
- **Long-term progression:** Career development should involve shaping the team's engineering philosophy, not merely increasing component levels every season.
- **Manufacturing integration:** Unlocked designs still require component manufacturing and installation on individual cars under the existing production rules.

Exact technology branches, prerequisite projects, trade-off magnitudes, and how regulations affect older concepts remain to be designed.

### Confirmed technical regulation transition

- **Advance notice:** Upcoming technical regulations are announced before they take effect.
- **Transition period:** Teams have a defined window to research and manufacture compliant components.
- **Existing designs:** Old-spec components remain usable until the new regulations take effect.
- **Strategic impact:** Players must prioritise R&D, production capacity, and per-car installation before the deadline, balancing current-season performance against future compliance.

Exact notice periods, transition deadlines, regulation scope, and the treatment of inventory or components already in production remain to be designed.

### Confirmed old-component rules

- **Legacy components after regulation changes**: affected components cannot be used in regulated competition once the new rules take effect, but remain in inventory or may be used for non-racing purposes. Resale or salvage value recovers part of the investment rather than deleting the assets outright.

### Confirmed car component structure

- **Hybrid component system**: manage roughly six major component families for manufacturing, inventory, repairs and installation, while each family has distinct development branches and engineering trade-offs. For example, aerodynamic development can branch toward high downforce or low drag. This keeps routine management understandable while preserving meaningful long-term engineering choices.

### Confirmed component wear and maintenance

- **Hybrid wear system**: components gradually lose condition, with performance penalties emerging at meaningful wear thresholds. Heavy loads, incidents and reliability weaknesses can accelerate wear. Depending on condition and cost, the player can repair, refurbish or replace parts. Exact wear curves, thresholds, costs and service-life balance will be tuned during simulation testing.

### Confirmed race simulation model

- **Hybrid event-driven simulation**: race progression advances through simulated time, while meaningful events—including overtakes, pit stops, tyre changes, weather transitions and incidents—are resolved at precise simulation moments. This supports detailed strategic decisions without requiring continuous calculation of every on-screen movement. The model must remain deterministic and saveable so a race can pause and resume reliably. Exact event scheduling and update granularity will be settled during the prototype.

### Confirmed first playable prototype scope

- **End-to-end vertical slice**: build one compact playable loop in which the player manages a team, prepares a car, races at one circuit, receives prize money and a post-race report, then improves the car for the next event. Start with simplified versions of supporting systems and expand them after the loop is playable and testable. This prototype is intended to validate the core experience before building the full career, all circuits and every advanced management feature.

### Confirmed first-prototype grid size

- **10-car prototype grid**: the player's team fields two drivers against eight rival drivers. This is large enough to exercise traffic, overtaking, tyre strategy and pit timing while keeping the first simulation easier to debug. The architecture should support scaling up to the intended 22-car, 11-team grid later.

## Open design decisions

These questions should be resolved during planning and prototyping before they become expensive assumptions:

- Exact rules for advancing or changing the clock and calculating offline time
- How queued projects, income caps, upkeep, and staff capacity work
- Whether automatic race completion is opt-in and how it affects closed-browser sessions
- The qualifying format and race-weekend flow
- How player commands behave when a race is running automatically
- Initial circuits, calendar, and championship scoring
- Driver/staff contracts, sponsor terms, and long-term career progression
- Final simulation formulas, event probabilities, and economy balance

## Project boundaries

- **Single-player only** for the planned experience.
- **Fictional teams, drivers, circuits, and branding** are the starting direction; avoid unlicensed F1 branding and assets.
- **No generative AI dependency** in the game simulation.
- **Offline-first**: the core game should remain playable without a server connection.
- **Redline Grid is separate and must remain untouched.**
- This repository is currently for planning. Implementation begins only after the design is reviewed and explicitly approved.

---

*This README is a living design document. Update it as decisions are confirmed and prototypes reveal what works.*
