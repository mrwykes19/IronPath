# IronPath v4

IronPath is a local-first gym workout planner and strength tracker. Version 4 preserves the existing training features while rebuilding the visual system around a premium blue-on-black interface.

## Included

- Four-day upper/lower program
- Set-by-set workout logging
- RIR tracking and progression recommendations
- Exercise substitutions
- Workout history and calendar
- Personal records and weekly summaries
- Strength, volume, and body-weight trends
- Readiness, soreness, and workout notes
- Netlify-ready web export
- iPhone Home Screen icon, favicon, and future native app icon

## Today screen

The dashboard is organized as:

1. standalone workout card;
2. weekly goals on the black background;
3. a 2 × 2 quick-metrics grid;
4. a separate full-width Start Workout button.

## Run locally

```bash
npm install
npx expo install --fix
npm run web
```

## Deploy to Netlify

The included `netlify.toml` uses:

```text
Build command: npm run build:web
Publish directory: dist
```

Replace the files in the existing GitHub repository, commit, and push. Netlify should redeploy automatically.

## Refresh the iPhone Home Screen icon

After Netlify finishes deploying:

1. Delete the existing IronPath shortcut from the iPhone Home Screen.
2. Open the Netlify site in Safari.
3. Tap **Share**.
4. Tap **Add to Home Screen**.

The new shortcut should use the included blue-and-black IronPath icon instead of the generic letter icon.

## Existing data

This version retains the existing browser storage structure, so workouts and weight entries stored by the earlier versions should remain available in the same browser.
