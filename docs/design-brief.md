# Gamified Task & Habit Tracker: Design Brief

2026-11-15

## Purpose and principles

A phone-first, full-RPG task manager and habit tracker for personal use, with quests, skills, stats and inventory, but without the setup friction that makes other gamified apps feel abstract.

The core problem: apps in this genre ask you to set difficulty, rewards and skills for every task, at the moment you have the least patience for it. The principle that follows is **derive, don't declare**: ask for as little as possible and let the app work out the rest.

- **Intuitive over configurable.** Every field at capture needs a strong reason to exist.
- **Observable over self-graded.** Prefer signals the app can see (time, postponements) to ratings that can be inflated.
- **Loop first, RPG second.** Stats and inventory serve the loop of cue, craving, response and reward; they are not the goal.

## Name and vocabulary

Working name: **Cynnau**, Welsh for "to kindle" (roughly *KUN-eye*; check pronunciation and meaning in a dictionary such as Geiriadur Prifysgol Cymru). It came from the identity direction of builder/keeper, with Hearth, Cairn and Keep considered and set aside.

Builder/keeper maps onto the app's two halves: projects are things you build, and habits are things you keep and tend. A verb about starting a fire covers the building side, and the hearth covers the keeping side.

Proposed vocabulary, to be tuned:

- **The hearth:** the home and Right Now screen, where you sit and tend things.
- **Builds:** long-term projects, a quest you construct over time.
- **Fuel:** XP, which feeds the fire.
- **Identity titles:** level names such as "Keeper of the Hearth", so character growth carries the identity.

Open: the name is an action rather than an identity. Test it aloud ("Open Cynnau") before committing.

## Platform and data

Build an Expo (React Native) app for Android. Expo is preferred over a web app because habit tracking depends on reliable scheduled notifications, which Expo handles better than a PWA.

- **Development:** run on the phone through Expo Go, scanning a QR code to see changes live.
- **Standalone install:** build an APK later, which needs the Android SDK and `adb` (or EAS Build).
- **Data (starting position, not final):** phone-only local storage, with an export-to-file button so a lost or reset phone does not wipe streaks.
- **Future sync:** store data as simple structured records (tasks, projects, skills, completions) so cloud or desktop sync can be added later without a rewrite.

## Task capture

Adding a task takes a title and two taps. Capture has to take seconds, because the moments you remember a task are ad hoc.

| Input | Options | What it drives |
| --- | --- | --- |
| Title | Free text | The quest name |
| Time | 5 min / 30 min / 2 hrs+ | Base XP, and whether it fits the Right Now screen |
| Dread | None / some / a lot | XP multiplier, measuring resistance rather than complexity |
| Skill | None (inherited from the project) | Which skill levels up |

There is no easy/medium/hard rating and no reward field. Both are derived.

## Progression

The main payoffs are character growth and momentum, with occasional loot as a reward in the habit loop. The numbers below are a proposed starting point to be tuned in use.

```latex
\text{XP} = \text{base}(\text{time}) \times \text{dread multiplier}
```

- **Dread multiplier:** keep it modest so inflating dread is not worth it. A possible extra is a capped "stubborn task" bonus when a task has been rolled over several days; the cap stops the app rewarding procrastination.
- **Skills:** life areas (for example work, running, writing, home), levelled by completing tasks in that area's projects.
- **Character growth:** skill levels and stats rise as XP accumulates.
- **Streaks:** forgiving by design, using a "never miss twice" rule or a streak that dips rather than resets, so one missed day does not feel like the system collapsing.
- **Loot:** occasional rather than constant, tied to real-life rewards you define once in a shop, to avoid eroding intrinsic motivation.

## The Right Now screen

The app opens to one question: what should I do right now? Task checking today is scattered and ad hoc, triggered by feeling overwhelmed or remembering something, so the app is designed around that moment rather than a scheduled check-in.

- **Input:** how much time and energy you have (for example 15 minutes, low energy).
- **Output:** two or three quests that fit.
- **Capture:** adding a task is available from this screen in seconds.
- **Notifications:** at most one gentle, optional evening prompt, so nudges never become nagging that gets muted.

How quests are selected is still to be designed (see open questions).

## Habit loop mapping

Each app feature should earn its place by serving one stage of the cue, craving, response, reward loop.

| Stage | App feature |
| --- | --- |
| Cue | The Right Now screen, opened in the moment of overwhelm or remembering; one optional evening nudge |
| Craving | A visible quest, a level almost reached, a streak at risk |
| Response | The task itself, kept low-friction by two-tap capture |
| Reward | Character growth and momentum as the core, with occasional loot |

## Open questions and risks

- [ ] **Quest selection:** how the Right Now screen ranks tasks (time fit, energy, dread, stubbornness, project).
- [ ] **XP and levels:** actual base values, multiplier size and the level curve.
- [ ] **Streak rules:** exactly how forgiveness works.
- [ ] **Data:** phone-only is the starting position; whether to add cloud backup or desktop sync is undecided.
- [ ] **The cue is unproven:** the real habit is ad hoc checking, so test early whether the Right Now screen actually gets opened.
- [ ] **Dread can be inflated:** keep the multiplier modest and cap any rollover bonus.
- [ ] **Loot can hollow out motivation:** keep it occasional and tied to rewards you chose.

## Build notes for Claude Code

Suggested build order, testing on the phone after each step. Claude Code cannot see the phone screen, so you report what looks or feels off.

1. Project setup: Expo app running on the phone through Expo Go.
2. Task capture (title plus two taps), local storage, and export to file.
3. The Right Now screen with simple quest selection. Use it for a week to test whether it becomes a daily habit before building further.
4. XP, skills and character growth.
5. Forgiving streaks.
6. The loot shop.
7. Optional evening notification.
8. Standalone APK install once the app is worth keeping on the phone.
