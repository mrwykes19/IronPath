# IronPath v6.3

IronPath is a local-first gym workout planner, adaptive strength coach, cardio tracker, and weight-progress application for iPhone and web.

## v6.3 highlights
- Higher-resolution supplied artwork throughout the app
- Full-width Today motivation hero
- Upgraded workout character graphics
- Upgraded Training Evolution graphics
- Upgraded Quick Metrics graphics
- Upgraded empty-state artwork
- Updated app icon and in-app branding
- All v6.2 functionality retained

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
