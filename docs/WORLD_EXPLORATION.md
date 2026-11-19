# World Exploration & Discovery

FlurryCraft's World Map now has a **fog-of-war exploration layer**.
The map keeps the current player's position, real terrain, known chapter
dungeons, nearby live monsters, landmarks and personal pins. It now also
records actual caves, generated loot locations, buried crypts and observed
monster territories.

## What reveals a marker?

Markers are not pre-filled, guessed coordinates or a global radar.
The game checks only already-loaded world chunks and current hostile
entities. A location enters the map and the world save after the player
gets close enough to verify it.

### Caves
- A cave marker requires a loaded chunk with a real open vertical shaft:
  clear air above a solid floor, raised solid sides and strong natural
  light at the opening.
- The scanner does not generate chunks, dig tunnels or modify terrain.
- The map records a **Natural Cave Mouth** only after the player comes
  within 36 blocks. The marker guides to the surface opening; inspect
  the drop and bring suitable equipment before entering.

### Hidden dungeons
- The existing world generator creates underground rooms with a water
  shaft to the surface, stone-brick markers, torches and two real chests.
- Those rooms are now identified as **Buried Crypts** using metadata on
  their existing generated loot entries.
- Approaching within 54 blocks reveals the crypt entrance and its two
  actual chest locations. Follow the marker to the water shaft and
  descend into the chamber. No new dungeon is built over player land.

### Treasure
- Generated cabin chests appear as **Abandoned Cabin Cache** markers
  after the player gets close to the real chest.
- The two existing chests inside a discovered Buried Crypt appear as
  separate **Crypt Treasure Chest** markers.
- Map entries only point to existing chests. Loot contents remain in
  the world's normal chest inventory; the scanner does not duplicate,
  grant or disclose the items.

### Monster territories
- A territory requires at least two living, hostile mobs of the same
  species in the same local region.
- The marker is an **approximate roaming zone**, not a promise that a
  monster will remain at one coordinate. The map draws a soft area ring.
- Single passing monsters remain in the existing **Nearby Monsters**
  live list; they do not falsely create a territory.

### Landmarks
- Existing Wayfarer Refuges, Aurora Waystones and Frost Cairns appear
  in the landmark filter and retain their Guide/Pin actions.
- Previously visited landmarks remain in the journal and map after
  leaving the immediate area.

## Using the upgraded World Map

Open the minimap during play to expand the World Map. The category
filters are:

- **All** — every known destination and personal pin
- **Caves** — discovered natural cave mouths
- **Dungeons** — known chapter dungeons and discovered Buried Crypts
- **Treasure** — cabin and crypt chests
- **Threats** — confirmed monster territories and currently loaded
  hostile monsters
- **Landmarks** — nearby/visited winter landmarks and journal places

Select a marker and use **Guide** to navigate. Use **Pin** to keep a
personal copy in the existing saved-pin list. The minimap uses distinct
symbols for the discovery categories. Monster territory rings are
approximate.

## Save, privacy and performance

- Discovery records are stored in the existing per-world save and
  portable JSON backup. Switching worlds does not mix discoveries.
- Old saves with no `exploration` field load as an empty discovery
  ledger. Existing edits, builds, chests, inventory, quests and
  progression are not reset.
- No GPS, network map tiles, location permissions or server calls.
- Scans run about every 2.25 seconds and inspect only already-loaded
  chunks plus the current mob list. They never force chunk generation.
- The scanner does not award XP, Flurry Points, SUI, NFTs or external
  cryptocurrency. Chests keep their original world loot.

## Verification checklist

1. Discover a real cave mouth and verify its marker appears only after
   approaching the opening.
2. Approach a generated water-shaft chamber; verify one Buried Crypt
   marker and two existing chest markers.
3. Approach an existing cabin chest; verify its cache marker.
4. Encounter a group of same-species hostiles; verify a territory ring
   appears, while a single passing mob remains a live pin.
5. Test All, Caves, Dungeons, Treasure, Threats and Landmarks filters.
6. Guide and pin each discovered location.
7. Save, reload and restore a portable world backup; discoveries persist.
8. Switch to another world; discoveries do not leak between saves.
9. Confirm existing world blocks, loot, inventory and rewards are unchanged.

Automated tests cover deterministic generated loot metadata, cave-opening
validation, discovery sanitation, mob clustering, browser map filters and
save/load behavior on desktop and touch-landscape emulation.
