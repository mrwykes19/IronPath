# IronPath v6.12

Adaptive strength, cardio, weight, and progress tracking for mobile web.

## v6.12

- Added dedicated Android/PWA icons at 192×192 and 512×512.
- Added maskable Android icons with safe-area padding for circular and rounded launcher shapes.
- Added a linked PWA manifest while retaining the separate Apple touch icon.
- Preserves all v6.10 workout-day, weekly-goal, cardio, and Gains behavior.

## Cloudflare

Use the folder containing `package.json` as the project path.

Build command:

```sh
npm install --no-audit --no-fund && npm run build:web
```

Deploy command:

```sh
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26
```
