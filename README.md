# Cynnau

Phone-first RPG task and habit tracker. *Derive, don't declare.* See [docs/design-brief.md](docs/design-brief.md).

## Install on your phone (one tap)

Every merge to `main` builds a fresh APK and publishes it to the rolling
[**latest release**](../../releases/tag/latest). On your Android phone:

1. Open the latest release link in Chrome (bookmark it, or add it to your home screen).
2. Tap `cynnau.apk` and open the download. Allow "install unknown apps" for Chrome the first time.
3. Updates install over the old version and keep your data.

## Develop

```bash
npm install
npm start        # scan the QR code with Expo Go for live reload
npm run web      # run in a browser (handy for quick checks)
npm run typecheck
npm test
```

## What is in the app

| Tab | What it does |
| --- | --- |
| 🔥 Hearth | The Right Now screen. Pick time and energy, get up to three quests or due habits. Done, Not now, and capture. |
| 🧱 Builds | Long-term projects and their quests, plus loose quests. A build is linked to a skill once; its quests inherit it. |
| 🌿 Habits | Things you keep: daily or N× a week, one tap to tend, a forgiving streak each. |
| 🛡️ Character | Level and identity title, five observed stats, skill levels. |
| 🎁 Loot | Sparks balance, your stash of won or bought rewards, and the shop of real-life rewards. |

Settings (the cog) holds the evening nudge, backups, and a plain-English summary of the rules.

**Insights** (from Settings or the Character tab) reads a private usage log to answer three questions: is the cue working (days opened, visits, visits that led to action, time of day), are the Right Now picks any good (picks done vs "Not now", vs things done from the lists), and is the pile growing. The log never leaves the phone except inside your own backups.

**Automatic backup** (Android): choose a folder once, for example one in Google Drive, and the app writes a dated backup there whenever you leave it after a change. It keeps one file per day for the last 7 days. Manual export and restore remain.

## Rules as built (all starting values, meant to be tuned)

These settle the brief's open questions for now. Each lives in one small file under `src/domain`.

- **Fuel (XP)** `xp.ts`: base 10 / 40 / 120 by time × dread ×1 / ×1.15 / ×1.3. Stubborn bonus +5% per day rolled over after the first, capped at +25%.
- **Levels** `xp.ts`: going from level L to L+1 costs 100 × L fuel (skills: 60 × L). Titles run from Spark-Striker to Hearthlord.
- **Quest selection** `rightNow.ts`: must fit the time. Ranked by energy fit (low energy prefers low dread, high energy prefers high), good use of the window, a capped stubborn nudge, and a lift for due habits (bigger if the streak is at risk). At least one slot is kept for a quest. "Not now" hides a quest until tomorrow and counts the postponement.
- **Streaks** `streaks.ts`: one missed day (or week) is forgiven and flagged "at risk"; each further consecutive miss halves the streak rather than resetting it. The day turns over at 4am.
- **Stats** `stats.ts`: Courage (dread faced), Stamina (long tasks), Tempo (quick wins), Constancy (habits tended), Grit (stubborn quests finished). Never set by hand.
- **Loot** `loot.ts`: sparks are a tenth of fuel. Rewards have a size only: small 30, medium 100, big 300 sparks. Drops happen on 6–15% of completions (dread, stubbornness and a 7+ streak nudge the odds); with no fitting reward the drop is a pouch of sparks.
- **Insights** `insights.ts`: a visit is an open more than five minutes after the last; it "led to action" if something was completed within 15 minutes.
- **Nudge** `notifications.ts`: one optional daily notification at 18:00–21:00. Nothing else notifies.

## Layout

- `src/domain` – pure logic and records, with tests. No React or storage in here.
- `src/state` – the app store: applies domain actions, persists, drives the reward toast and undo.
- `src/storage` – local storage, JSON export and restore (with v1 → v2 migration).
- `src/ui` – shared kit, forms, and one file per screen. `App.tsx` is the shell and tab bar.

## Not built yet

- Desktop sync. Backups are files in a folder you choose, not a live sync.
- Scheduled or dated quests, reminders per habit, and editing past completions.
- Tuning from real use: every number above is a first guess.
