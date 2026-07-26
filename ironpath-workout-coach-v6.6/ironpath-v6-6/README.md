# IronPath v6.6

IronPath is a local-first adaptive workout planner, strength and cardio tracker, and weight-progress app.

## v6.6 highlights
- Configurable weekly workout, cardio-day, calorie, and active-minute goals
- Custom workouts without advancing the recommended plan
- Manual and timed cardio logging
- Adaptive four-phase training blocks
- Backup and restore

## Cloudflare build
```bash
npm install --no-audit --no-fund && npm run build:web
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26
```
