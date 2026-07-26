# IronPath v5.5 v5

IronPath is a local-first gym workout planner, strength tracker, cardio log, and adaptive four-phase training coach.

## v5 highlights

- Selectable four-phase Training Evolution preview
- Volume Base, Build, Progress, and Peak programming
- Live phase review and Advance / Repeat / Regenerate controls
- Distinctive workout names
- Daily rotating motivational quote
- Editable workout preview
- Adaptive exercise rotation and plateau detection
- Strength, weight, cardio, history, and backup features

## Run locally

```bash
npm install
npm run web
```

## Cloudflare

Use the same configuration as the prior version:

```text
Build command:
npm install --no-audit --no-fund && npm run build:web

Deploy command:
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26

Version command:
npx wrangler --version
```

Set the root directory to the folder containing this file and `package.json`.

## Updating an existing deployment

The simplest approach is to keep one permanent GitHub app folder and replace only its contents. That allows the Cloudflare root directory to remain unchanged between releases.


## v5.5 additions

- Add past cardio sessions without starting the timer.
- Record activity, date, duration, distance, calories, and notes.
- New dumbbell/IP app icon for Safari Home Screen, favicon, and future native builds.
