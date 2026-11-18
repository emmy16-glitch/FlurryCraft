# Mobile gameplay review — 18 November 2026

Source video: user gameplay recording (2 minutes, landscape Android), reviewed during the November Survival Combat update.

## Observations and changes

| Video position | Observation | Source fix |
| --- | --- | --- |
| ~0–20 seconds | Very low, gray spruce branches reduce terrain and sky visibility | Raise new procedural spruce canopy bottom by two blocks in `js/worldgen.js`; existing player-built blocks remain untouched |
| ~15–50 seconds | Frostlings fill a large part of the first-person view during close-range attacks | Winter creature attack/stop distances in `js/mobs.js` and `js/winter-survival-core.js` |
| ~30–60 seconds | Health and food are difficult to read while fighting | Live Survival vitals and accessible healing action in `js/adventure.js` |
| ~60 seconds | XP and level progression work | Kept existing progression, added new recovery mechanic without changing saved XP |
| ~90–120 seconds | Night combat appears very dark and repeated red hit flashes obscure play | Slightly raise ambient low-light floor in `js/main.js`; soften red vignette in `index.html` |
| Throughout | Wide inventory hotbar includes many empty slots; target health overlaps central viewing area | Reduce touch hotbar width; move target health overlay higher |

## Recovery gameplay

Survival players may spend 2 Frost Shards to restore up to 6 HP, with a 12-second in-game cooldown. Recovery is in the compact health/food HUD and Winter Adventure menu. It cannot be activated at full health, while dead or in Creative mode. This change does not mint or require any wallet assets.

## Regression checklist for real Android browser

1. Confirm the latest GitHub Actions deploy passed; reopen or refresh the website. Do not clear browser site storage, because worlds are locally saved.
2. Resume an existing Survival save and verify the LV pill and new HP/Food panel do not cover the map or attack controls.
3. Equip a sword; approach a Frostling. Confirm the mobile action switches between MINE and ATTACK while aiming at terrain or a creature.
4. Fight near an old and a newly loaded spruce tree; note that procedural foliage may regenerate differently, while edits and player-built blocks should remain.
5. Gather at least 2 Frost Shards, lose health, press HEAL. Expect +6 HP (up to 20), 2 shards removed, and a 12-second cooldown.
6. Open Winter Adventure and confirm the recovery button reflects the same resources and cooldown.
7. Fight at night and check screen visibility, player damage flashes, and whether the camera can still track attacking enemies.
8. Enter Frost Ruins and clear all three chambers; verify progress, loot, and Winter Ward protection. Save, quit, and reload.

## Verification status

JavaScript syntax, recovery rule checks, canopy headroom and a mock gameplay recovery interaction were checked during implementation. Full browser/WebGL and physical-device QA, and the post-push GitHub Pages workflow result, remain **unverified** until tested externally. The game remains pre-alpha.
