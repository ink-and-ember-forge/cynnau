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
npm run typecheck
npm test
```

## Layout

- `src/domain` – pure logic (XP, Right Now quest selection) with tests
- `src/storage` – local storage and JSON export
- `src/ui` – components; `App.tsx` – the Right Now screen

## Status

Slice 1 (build steps 1–3 of the brief): two-tap capture, local storage, export, Right Now screen with simple selection, plus a basic fuel (XP) total. Skills, streaks, loot and notifications are not built yet.
