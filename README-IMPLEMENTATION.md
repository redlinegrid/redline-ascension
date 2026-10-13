# Redline Paddock — First Playable Prototype

This branch contains the first implementation pass for the agreed end-to-end prototype.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## Included in this pass

- Dark, responsive Redline Paddock operations interface.
- Ten-car fictional grid: two player drivers and eight rivals.
- Start, pause/resume, and 1×/2×/4× simulation controls.
- Per-driver pace, next-tyre and pit-lap strategy controls.
- Seeded local race simulation with tyre wear, fuel consumption, pit stops, position changes and finish classification.
- Basic prize money, post-race report, and car-upgrade loop.
- Browser-local save/restore of the current career and in-progress race state.

## Prototype limitations

This is an early playable foundation, not the full planned simulation. Race progression and strategy effects are deliberately simplified. Weather, detailed damage, qualifying and sprint formats, the full 22-car grid, staff departments, regulation changes, save migrations, and full financial/sponsorship systems are not implemented yet.

The stylesheet may load Google Fonts when online, with system fallbacks. Core gameplay does not depend on an external service.

## Engineering checks

- Run `npm install` and `npm run build` in a Node environment.
- Test pause/resume and reloading a saved race in the same browser.
- Review pit-command behavior, race timing and prize payout calculations before extending the simulation.
