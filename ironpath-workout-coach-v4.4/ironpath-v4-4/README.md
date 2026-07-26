
## v4.4 additions

- Choose 2, 3, 4, or 5 strength workouts per week in Settings.
- Track treadmill, bike, elliptical, rower, stair-climber, running, and walking sessions from Today.
- Cardio timers continue from their saved start time when the app is reopened.
- Enter miles and optional notes when a cardio session ends.
- Review cardio distance progression in Gains.
- Data & Backup is located immediately above Reset Local Data.

# IronPath v4.2

IronPath is a local-first gym workout planner and strength tracker. Version 4.2 adds goal-aware workout programming while retaining portable backups and local-first storage.

## Included

- Four-day upper/lower program
- Set-by-set workout logging
- RIR tracking and progression recommendations
- Exercise substitutions
- Workout history and calendar
- Personal records and weekly summaries
- Strength, volume, and body-weight trends
- Readiness, soreness, and workout notes
- Export and import backups
- Merge or replace restore modes
- iPhone Home Screen icon and favicon

## Goal-aware programs

Changing **Primary Goal** in Settings now changes future workouts:

- **Balanced:** mixed strength and muscle work.
- **Strength:** heavier compound work, lower reps, and longer rest.
- **Muscle:** more working sets and hypertrophy-focused rep ranges.
- **Fat Loss:** denser sessions with shorter rest while keeping major lifts.

IronPath asks for confirmation before applying a new goal. Completed workouts and a workout already in progress are never rewritten.

## Export a backup on iPhone

1. Open **Settings** in IronPath.
2. Tap **Export backup**.
3. In the iPhone share sheet, choose **Save to Files**.
4. Save the JSON file in iCloud Drive or On My iPhone.

The backup filename follows this format:

```text
IronPath-Backup-YYYY-MM-DD.json
```

## Import a backup

1. Open **Settings**.
2. Tap **Import backup**.
3. Select an IronPath JSON backup from Files.
4. Review the verified backup summary.
5. Choose:
   - **Merge with current data** to combine workout and weight history while applying the backup profile settings; or
   - **Replace all current data** to make this device match the backup.

## Privacy

Backups are created directly on the device. IronPath does not upload the backup to a server. The file remains wherever the user saves or shares it.

## Run locally

```bash
npm install
npx expo install --fix
npm run web
```

## Deploy through the existing Cloudflare project

Replace the current project files with the contents of this folder, commit, and push to GitHub. The existing Cloudflare build configuration can remain unchanged.

The current working Cloudflare configuration is typically:

```text
Build command:
npm install --no-audit --no-fund && npm run build:web

Deploy command:
npx wrangler deploy --assets ./dist --compatibility-date 2026-07-26
```

Keep the same Cloudflare URL so existing browser data remains available.

## Existing data

This version retains the existing browser storage key. Workouts and weight entries stored under the same IronPath URL in the same non-private Safari profile should remain available.


## Adaptive weekly plan

Open **Settings → My Training Week** to generate and customize the current week. Choose Consistent, Moderate, or High variety; lock favorite exercises; reorder, remove, add, or swap exercises; and adjust set counts. IronPath uses a four-week block and recent performance to decide when rotation is useful.
