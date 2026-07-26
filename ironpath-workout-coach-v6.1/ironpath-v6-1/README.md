# IronPath v6

IronPath is a local-first gym workout planner, adaptive strength coach, cardio tracker, and weight-progress application for iPhone and web.

## v6 highlights
- Full visual redesign based on the approved IronPath promotional concept
- Integrated workout illustrations on Today
- Rich cardio equipment graphics
- Enhanced phase and achievement visuals
- Manual and timed cardio logging
- Four-phase adaptive training blocks
- Editable workout previews and weekly plans
- Backup and restore

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
