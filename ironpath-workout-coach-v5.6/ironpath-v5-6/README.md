# IronPath v5.6

IronPath is a local-first gym workout planner, strength tracker, cardio log, and adaptive four-phase training coach.

## v5.6 visual identity update

- Replaced the plain in-app `IP` tiles with the dumbbell/IP hybrid brand mark.
- Added locally bundled cardio equipment graphics for treadmill, bike, elliptical, rower, and stair climber.
- Added visual phase identities for Volume Base, Build, Progress, and Peak.
- Added designed PR, streak, workout, and weight milestone badges.
- Added branded empty-state graphics for workouts, history, weight, and records.
- Updated the desktop brand rail to use the same mark as the Home Screen icon.
- All graphics are bundled with the app and work without external image hosting.

## Existing features retained

- Live and manual cardio tracking
- Four-phase Training Evolution preview and controls
- Adaptive weekly programming and workout editing
- Daily motivational quote
- Cardio trends, backup/restore, weight tracking, and progression recommendations

## Run locally

```bash
npm install
npm run web
```

## Cloudflare

```text
Build command:
npm install --no-audit --no-fund && npm run build:web

Deploy command:
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26

Version command:
npx wrangler --version
```

Set the root directory to the folder containing this file and `package.json`. Keeping one permanent GitHub app folder and replacing only its contents avoids changing the Cloudflare root directory between releases.
