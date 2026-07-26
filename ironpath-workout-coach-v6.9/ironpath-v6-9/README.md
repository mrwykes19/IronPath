# IronPath v6.9

IronPath is a local-first gym workout planner, adaptive strength coach, cardio tracker, and weight-progress app for iPhone and web.

## v6.9 highlights
- Selectable workout splits
- Custom split builder
- Seven-day workout schedule on Today
- Tappable daily workout previews
- Start any planned workout from the schedule
- Existing adaptive four-phase progression, cardio, Gains, weekly goals, custom workouts, and backup/restore

## Run locally

```bash
npm install
npm run web
```

## Build for Cloudflare

```bash
npm install --no-audit --no-fund && npm run build:web
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26
```

Keep Cloudflare's root directory pointed at the folder containing this `package.json`.
