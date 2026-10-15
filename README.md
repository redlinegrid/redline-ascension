# Redline Ascension

> **Build your team. Engineer your future. Survive the season.**

A single-player motorsport **roguelite management game** where every run is a new attempt to turn an underdog team into a racing force. Draft upgrades, shape a build, manage your cash, make difficult paddock decisions, and adapt your race strategy as the championship unfolds.

**Live Demo:** [Play Redline Ascension](https://redlinegrid.github.io/redline-paddock/)  
**Project:** Redline Ascension  
**Genre:** Motorsport management · Roguelite · Strategy  
**Platform:** Browser  
**Related project:** Redline Grid — a separate project sharing the Redline brand

---

## The game

Redline Ascension is not an idle game and does not revolve around waiting for projects to finish offline. Its core is a sequence of race weekends, strategic choices, upgrade drafts, financial pressure, and persistent progression between runs.

Each run asks you to make the most of a limited budget and the opportunities you are offered. Upgrade choices can push your team toward outright pace, tyre conservation, faster pit stops, reliability, risky performance, or stronger commercial returns. Paddock incidents add uncertainty, while driver selection, race strategy, and cash management shape how far your team can go.

Runs are designed to be replayable: different upgrade offers, event choices, and run-specific builds create different paths through the same motorsport challenge.

## Core gameplay loop

1. **Choose a mode.** Start a finite 20-round Championship or test your limits in Endless mode.
2. **Create your team.** Set up your team identity, choose your drivers, and enter the season.
3. **Choose an opening upgrade.** Start the run with a meaningful build direction rather than waiting for progression to begin.
4. **Race and make decisions.** Manage tyre compounds, pace, pit timing, and race-day risks as the field develops.
5. **Draft upgrades between races.** Choose from a small set of offered upgrades. Each choice can strengthen a car system, improve your finances, or establish a more specialised build.
6. **Handle paddock events.** Respond to technical protests, sponsor demands, supplier problems, team drama, and rival pressure. Choices can affect cash, morale, and reputation.
7. **Manage the team's survival.** Race results, sponsor income, operating costs, and driver contracts all affect your ability to continue.
8. **Finish the run—or push further.** Complete the Championship, continue in Endless, or face the consequences if the team's finances collapse.
9. **Invest in permanent research.** Earn Research Points from runs and spend them in the Research Lab to unlock lasting advantages for future attempts.

## Game modes

### Championship

A finite **20-round campaign**. Build your team over the course of the championship, balance immediate results against long-term survival, and try to finish the campaign.

### Endless

Continue beyond Round 20 and see how long your team and build can remain competitive. Endless mode is intended for players who want to push their upgrades, finances, and strategy as far as possible.

## Build your run

Upgrade drafts are central to the roguelite structure. Choices are not limited to a single linear technology tree: different upgrades can change how the team approaches a race weekend.

Current upgrade directions include:

| Build direction | Intended strength | Trade-off or focus |
| --- | --- | --- |
| Aerodynamics | Better cornering performance | Develop the aero package |
| Power unit | Stronger acceleration and pace | Develop power and deployment |
| Mechanical grip | Better balance and tyre behaviour | Improve suspension and tyre management |
| Reliability | Reduce wear-related risk | Prioritise finishing and component life |
| Endurance | Preserve tyres for longer stints | Trade some headline pace for tyre life |
| Operations | Reduce time lost in pit stops | Invest in race-weekend execution |
| High risk | Extract more lap time | Accept increased wear and incident consequences |
| Sponsor network | Improve commercial returns | Turn race weekends into funding opportunities |
| Survival | Reduce wear and damage | Accept a small pace penalty for resilience |

Upgrades have different rarities and effects. Some increase a car system's level; others add a run-specific trait that changes how the build performs for the rest of that attempt. Combining upgrades across systems can also activate build synergies.

## Permanent progression: Research Lab

Research Lab progression persists between runs. Research Points earned through gameplay can be invested in permanent perks, giving future attempts new advantages without removing the need to make good decisions during a run.

The Lab contains upgrades across several areas:

- **Car performance:** aerodynamics, engine power, chassis balance, and energy recovery
- **Race operations:** tyre management, pit-crew training, reliability, and repair efficiency
- **Driver development:** pace, qualifying preparation, racecraft, and consistency
- **Race strategy:** strategy simulation, weather analysis, safety-car planning, and opponent analysis
- **Team development:** research efficiency, staff training, factory workflow, and simulator programmes
- **Commercial and finance:** sponsor network, contract negotiation, budget management, and prize-money bonuses

The Research Lab is a between-runs meta-progression system, not an in-race menu. Run-specific cash and upgrade choices are separate from permanent research progress.

## Race strategy

Cars race automatically; the player manages the strategic decisions that influence their results. Race control focuses on readable information and deliberate choices rather than direct driving.

Key systems include:

- A 22-car field with the player's two drivers competing against rival teams
- Soft, Medium, and Hard tyre compounds, each with different pace and wear characteristics
- Conserve, Balanced, and Push pace modes
- Tyre wear, fuel, car condition, pit stops, and race progress
- Overtaking, changing positions, incidents, and safety-car periods
- Race events and status information to help explain what is happening
- Different circuits and race conditions across a run

The goal is to make strategy legible: pace, tyre life, reliability, and pit timing should create trade-offs rather than one universally correct action.

## Paddock events and consequences

Race weekends can bring problems that are not solved by lap time alone. Events may involve:

- Technical protests and scrutineering
- Sponsor pressure and commercial opportunities
- Leaked radio messages and public reputation
- Supplier delays and component compromises
- Driver contract concerns
- Rival teams attempting to poach staff

Events present multiple responses, each with its own financial, morale, or reputation consequences. There may not be a perfect answer—your decision depends on the state of the run and the risks you are willing to take.

## Team and financial management

The team begins with limited resources. Race payouts and sponsor-related effects can fund upgrades, but recurring costs and poor results can put the run at risk.

The management layer includes:

- Team name and visual identity
- Driver selection and driver characteristics
- Driver contracts and per-race salaries
- Team morale and reputation
- Race income, operating costs, and cash reserves
- Run-ending financial pressure
- Upgrade choices that can improve performance or strengthen the economy

A fast car is only one route to success. A reliable build, a strong commercial strategy, or carefully managed spending can be just as important to surviving a long campaign.

## Design principles

1. **Every run should feel different.** Drafts, run traits, events, and choices should create varied strategies.
2. **Choices should have consequences.** Performance, reliability, money, morale, and reputation compete for attention.
3. **Easy to learn, meaningful to master.** Present a small number of clear options at a time, with enough depth for long-term experimentation.
4. **Racing should remain the centrepiece.** Management systems exist to make race outcomes and between-race decisions matter.
5. **Permanent progression should support replayability.** Research unlocks useful advantages while leaving each run's choices important.
6. **The game should explain its outcomes.** Race status, event messages, and upgrade descriptions should help players understand why a decision worked—or failed.

## Visual direction

Redline Ascension shares the Redline family's dark, technical motorsport aesthetic:

- Dark charcoal and near-black surfaces
- Restrained racing-red accents
- Compact race-control panels and clear status hierarchy
- Strong upgrade cards and build-focused presentation
- Responsive layouts for desktop and mobile

Redline Ascension is a standalone game with its own gameplay identity. **Redline Grid remains a separate project and must not be changed as part of this game.**

## Development notes

The project is implemented as a browser application using React, TypeScript, and Vite. The race and progression logic lives primarily in TypeScript simulation code, while the interface presents the current run, upgrade choices, Research Lab, and race-control decisions.

Balance, upgrade effects, economy values, and the available event pool may change as the game develops. The live implementation—not the earlier idle-management concept—is the reference for the current gameplay direction.

## Project boundaries

- Single-player experience
- Fictional teams, drivers, circuits, and branding
- Roguelite runs with persistent Research Lab progression
- No requirement to add idle/offline project progression as a core mechanic
- Redline Grid remains a separate project

---

*Redline Ascension: every race is a decision, every run is a new build, and every upgrade is another chance to rise.*

## Latest update

Championship runs now track eight achievement milestones, including first points, podiums, wins, points streaks, a 100-point season, a top-three finish, and the world championship. Unlocks award cash, and eligible achievements also grant permanent Research Points.


## Engineering Codex

The Engineering Codex is a permanent, local-first knowledge archive for upgrade discoveries, active build synergies, a non-destructive build planner, and completed-run dossiers. Open it from the game header, or visit the companion view at [Engineering Codex](https://redlinegrid.github.io/redline-paddock/?view=codex). The companion shares browser-local records with the game; use Save / Transfer to include Codex discoveries and dossiers in a save code when moving between devices. Existing save codes remain compatible.


## Engineering Codex Expansion

The Codex now includes an expanded technology catalogue with five rarity tiers, per-category discovery progress, technology mastery based on completed runs, and a persistent favourites filter. Catalogue additions use the existing simulation's supported upgrade effects; mastery and favourites are stored locally and included in Save / Transfer exports. Older career saves and Codex metadata are migrated with empty defaults for the new fields.


## Engineering Codex Update B — Technology Evolutions

The Synergy Lab now lists data-driven technology evolution recipes. Installing all required technologies in a run activates a recipe once and grants its defined module or cash bonus. Activated evolution IDs are stored on the race state; the field is optional so older saves continue to load. The planner previews recipe requirements without changing the actual save. Championship Achievements now sits directly below the rival-intelligence panel in the race dashboard.
