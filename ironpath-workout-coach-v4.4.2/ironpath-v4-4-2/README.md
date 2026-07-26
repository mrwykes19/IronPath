# IronPath v4.4.2

IronPath is a local-first workout planner and tracker for iPhone and web.

## Training-block behavior

A first-time user begins at the opening phase of a four-phase block. The progression is rolling and begins from the date the block is created, not from an arbitrary calendar week.

1. **Volume Base:** two equipment increments below the current working recommendation, with higher repetition targets.
2. **Build:** one increment below the current recommendation, with moderately high repetitions.
3. **Progress:** the normal recommended working load and rep range.
4. **Peak:** one increment above the normal recommendation, with lower repetitions and slightly longer rest.

After the fourth phase, IronPath begins a new adaptive block. Exercise rotation still follows the user's variety setting, exercise locks, performance history, readiness, and plateau detection.

## Edit before training

Tap Today's Workout to open the preview, then tap **Edit**. From there you may reorder exercises, add or remove exercises, swap a movement, and change the number of sets before starting.

## Cloudflare build settings

Build command:

```text
npm install --no-audit --no-fund && npm run build:web
```

Deploy command:

```text
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26
```

Root directory: the GitHub folder containing this project's `package.json`.
