# IronPath v6.4

IronPath is a local-first gym workout planner, adaptive strength coach, cardio tracker, and weight-progress application for iPhone and web.

## v6.4 polish
- Corrected Quick Metrics graphics
- Single workout-preview control
- Centered Today branding
- High-resolution cardio activity artwork
- Dedicated weight-tracking artwork

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
