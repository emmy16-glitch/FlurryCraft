# FlurryCraft — Clear Start Screen, Always Daylight and Live Map

## Start Screen (simplified)
The landing page now has just three primary actions:
- **Continue Game** resumes the most recently saved world. It is disabled when there is no save.
- **New Game** reveals two clear game modes: **Survival** (fight, quests, XP) or **Creative** (unlimited building).
- **Load Game** shows the existing list of separately saved worlds. **Play**, **Backup** and **Delete** remain available there, rather than cluttering the initial view.

A collapsed **More options** area contains the Guided Adventure Demo, optional Yeti customization and backup-related controls. Advanced settings, including seed, difficulty, graphics and view distance, remain available under **Game settings**. Existing save IDs, world data, timestamps, portable backup format and deletion safeguards are unchanged. New auto-generated worlds get helpful names like **Survival Adventure** or **Creative World** instead of unfamiliar numbered labels; save IDs remain unique.

## Always Daylight (temporary)
Until the night system is redesigned, the game environment uses a fixed **12:00 daytime** lighting phase in both Survival and Creative, including saved worlds that previously had a nighttime clock. The simulation clamps the clock at gameplay entry and on every active/paused frame. Saved world data is not erased, reset or converted; other progress is untouched. There is no switch that can bring back night accidentally. Weather and snow remain optional.

## Map: Known Dungeons, Nearby Monsters and My Pins
The existing minimap and full World Map now show:
- **Known dungeon sites**: Frost Ruins once discovered, plus Stormspire, Aurora Citadel and Frostbound Abyss only when their sites have been scouted and stored in Adventure progress. Entry markers are placed at the corresponding real northern gate coordinates.
- **Nearby monsters**: up to twelve **living, hostile, currently loaded** enemies within 96 blocks. They are refreshed as monsters move and disappear on death/unload. This is **not a global monster radar**, and it never invents monsters outside the game's active chunks.
- **Your saved pins**: personal map markers are still stored separately for each world, and may be deleted. Tap the map, or use **Mark here**. You can also press **Pin** beside a known dungeon or nearby monster to save that exact location as a permanent marker. The saved monster pin represents its **last seen location**, not real-time tracking after it moves.

The full map sidebar groups **Known Dungeons**, **Nearby Monsters · Live** and **Your Saved Pins**, with guide actions to navigate. The small minimap uses yellow square dungeon markers, red monster dots and existing saved-pin markers. The game draws these from existing lightweight map canvas overlays rather than introducing extra WebGL meshes or remote map tiles.

## Expected behavior
- Continuing a world preserves edits, inventory, XP, quests, progress and world backups.
- New Survival creates a playable Survival world; Creative creates an unlimited-build world.
- The demo exists under optional controls, not as a main entry point.
- Snowy scenes remain clearly visible and daytime across restored saves.
- Only real discovered dungeons and real, nearby hostile mobs show on the live map.
- Monster sightings can be saved as a static pin, but monsters may move away.

## Test coverage
- JavaScript unit tests for dungeon coordinates, hostile-only enemy filtering, detection radius, max 12 monster budget and map hit testing.
- Browser smoke on desktop and touch landscape: three-action menu, new-game mode selector, Load Game, permanent daytime, actual dungeon marker, a genuine in-engine Frostling marker and personal pins.
- Existing JavaScript, Sui/BCS and browser QA remain required before merge.

*Chromium emulation is not a physical Android performance test.*
