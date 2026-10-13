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

## Deploy to Vercel

This project is configured for Vercel in `vercel.json` (Vite build, `dist` output, and SPA fallback).

1. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
2. Import `redlinegrid/redline-paddock` from GitHub and authorize access to this repository if prompted.
3. Select the `feature/first-playable-prototype` branch for a preview deployment. Vercel should detect Vite; confirm the build command is `npm run build` and output directory is `dist`.
4. Click **Deploy**. When the build succeeds, Vercel will provide a shareable `.vercel.app` URL.

The repository is private, so Vercel must have GitHub access. Vercel's Hobby plan may not allow deploying a private repository owned by a GitHub organization; if that restriction appears, use an eligible Vercel team/plan or deploy from a repository/account setup that your plan supports. The production URL is not available until a deployment actually succeeds.
