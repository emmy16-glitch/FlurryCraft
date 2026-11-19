# Recording-driven UI polish

This pass responds to the recorded mobile gameplay and World Map screens.
It improves presentation and navigation while retaining the existing
offline world, chapter, expedition, combat, and Testnet safety rules.

## World Map

- Six categories are presented together in a compact 3-by-2 filter grid:
  All, Caves, Dungeons, Treasure, Threats, and Landmarks. Each shows
  a count and an accessible label.
- The filter row remains fixed while the destination list scrolls.
  The terrain map and destination list use separate scroll regions,
  including in short landscape screens.
- Selecting a category filters both the destination list and map
  overlay markers; the minimap still shows the nearby world context.
- Real discovered cave mouths, buried crypts, actual chest coordinates,
  confirmed hostile territories, nearby live mobs, and winter landmarks
  retain their existing Guide and Pin actions.

## Chapter progression and expeditions

The map now summarizes the same unlock conditions used by Adventure:

| Chapter | Unlock requirement |
|---|---|
| Frost Ruins | Starter chapter |
| Stormspire Keep | Level 10 and at least one Frost Ruins clear |
| Aurora Citadel | Level 20 and at least one Stormspire clear |
| Frostbound Abyss | Level 30 and at least one Aurora Citadel clear |

Known sites show their actual coordinates, build status, and clear count.
Locked chapters show the real requirement and cannot be guided to until
a destination exists. The map also displays the active accepted
Expedition, its progress, and a relevant action: guide to Frost Ruins
for clear missions, show Threats for creature missions, or center the
map on the player for building missions. No fabricated objective
coordinates are created.

## Guide navigation

Guide now shows a compass arrow, destination name, block distance,
and relative direction (Ahead, Left, Right, or Behind). The minimap
also shows a directional arrow and distance. Stop Guide remains an
accessible action. No GPS or remote map tiles are used.

## Gameplay HUD

The level and health panels respect device safe areas and use tighter
spacing in landscape. The heal action is hidden at full health and
disabled when its real Survival requirements are not met. The
Expedition tracker is now a compact card with mission detail and a
progress meter. On desktop it sits below the minimap; on short
touch-landscape screens it moves to the upper-right strip above the
minimap so they do not overlap.

## Sui marketplace status

Because `SUI_PACKAGE_ID` is still empty and there is no independently
verified marketplace contract, the player-facing page now explicitly
says **NOT LIVE**. It lists NFT minting, listings/purchases and
marketplace payments as disabled or unavailable. The optional Testnet
wallet check remains read-only. No buy, mint, listing, or payment
control is exposed in this state. Developer publishing remains behind
the explicit developer-only panel and wallet approval.

## Verification

Automated browser QA now checks:
1. All six map categories are visible in the viewport and respond to
   desktop keyboard and mobile touch.
2. Chapter progression and the active Expedition appear in the map.
3. Each category filters actual markers and the map overlay.
4. Guide displays a real target name, distance, and relative direction.
5. Level, vitals, minimap and Expedition tracker are present without
   overlapping in the desktop and touch-landscape profiles.
6. Marketplace status is clearly not live and no trading controls
   appear before a verified package is configured.

These are browser-emulation checks. A physical Android-device pass
is still recommended for final touch comfort and frame pacing.
