# FlurryCraft — Chapter 2: Stormspire Keep

Status: Source implementation committed on 18 November 2026. Real Android/browser gameplay QA and GitHub Pages deployment verification are still needed.

## How to unlock

1. Start or resume a **Survival** world with Easy or Hard/Normal combat enabled. Creative mode is a builder sandbox and does not progress dungeon fights.
2. Reach **Level 10** and clear **Frost Ruins** at least once. Both are required to unlock Stormspire.
3. Open **Menu → Winter Adventure → Scout Stormspire Site**. This only selects a dry region about 100 blocks from spawn and adds a map guidance destination; scouting alone does not modify terrain.
4. Once you are happy with the site, choose **Build Stormspire · 15 × 51 blocks**. Read the confirmation warning carefully: the game will clear and rebuild that area, including any existing player structures. Back up and inspect the selected site first.
5. Follow **Guide to Stormspire** to the northern arch. Construction happens in small groups as the chunks load. The build status is displayed in Winter Adventure. If you leave before completion, return to the menu and prepare/upgrade the dungeon again; existing cleared edits remain in your world.
6. Approach the north gate and tap **Enter Stormspire** (or the button in Winter Adventure when near the gate).

## Three connected halls

| Hall | Encounter | How to proceed |
| --- | --- | --- |
| 1. Hound Courtyard | Two Storm Hounds | Defeat both, then walk deeper |
| 2. Rime Guard Hall | A Rime Knight and Storm Hound | Defeat both, then cross the next doorway |
| 3. Eye of the Blizzard | Blizzard Titan | Defeat the boss; your chapter rewards are granted |

The Blizzard Titan sometimes charges a storm pulse while its target is in range. A warning toast and charge sound precede the pulse; back away to dodge it. Pulse requires line-of-sight and does not pass through walls. The Titan also uses regular melee attacks. Clear results are counted separately from the old Frost Ruins.

## Rewards and progression

The first clear gives **one Iron Sword**, **9 Frost Shards**, **24 Froststone Bricks** and **260 completion XP**, in addition to ordinary enemy XP and drops. If the inventory is full, the sword drops by the player to collect. Subsequent clears reward materials and completion XP, but not duplicate first-clear swords. The adjusted Chapter 2 creature XP multiplier is intentionally gentler than the early-game curve, so players can continue progressing across Levels 11–20.

Chapter 2 introduces Storm Hounds, Rime Knights, and Blizzard Titans. Once the player reaches their respective level thresholds, these can also appear in snowy overworld encounters. Chapter 1 monsters remain capped at Level 10, while the new creatures are capped at Level 20.

## Save compatibility

Chapter 2 is stored under the existing world-specific `adventure.storm` save entry: `site`, `built`, `version` and `clears`. Old worlds load with an empty Stormspire entry and retain their original Frost Ruins `den`, level, XP, enemy kills, wards, and legacy progression. Stormspire is never auto-generated in old worlds.

## QA checklist on Android

- [ ] Open a legacy save at a low level; Stormspire should remain locked and the old Frost Ruins must remain unchanged
- [ ] Reach Level 10 and complete the first dungeon; scout location without editing terrain
- [ ] Confirm construction only after inspecting the site; navigate there and watch it complete without freezing the phone
- [ ] Confirm the Stormspire entry prompt appears only near its northern gate
- [ ] Fight all three rooms using the single mobile Mine/Attack button; the next wave must not start until the previous room is cleared and entered
- [ ] Hear/see Titan charge warning; test dodging by leaving its range
- [ ] Collect first-clear sword, shards and bricks, save/exit/reload, and verify the site and clear count persist
- [ ] Repeat the dungeon; confirm second clear does not grant another first-clear sword
- [ ] Compare daylight and nighttime encounters for new monsters; check they still appear at high player levels
- [ ] Test low render distance (3–4) and confirm construction continues as new chunks become loaded

## Validation performed during implementation

The Chapter 2 pure-logic tests and mocked live-game integration tests were exercised in a JavaScript environment, including gates, world-geometry corridors, 3 combat waves, XP and saved progress, legacy save preservation, and loading-aware construction. Modified JS modules passed syntax checks. This is not a substitute for the GitHub Actions `npm test` workflow or real browser/WebGL/device validation. No wallet activation or on-chain transactions were added.
