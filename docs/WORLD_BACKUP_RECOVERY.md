# FlurryCraft — Full World Backup & Recovery

Updated 18 November 2026. Source implementation on `main`; real Android/Chrome and GitHub Pages QA still needed.

## What this protects

A full world backup contains the **terrain seed, edited blocks, built castles, inventory and equipment, home/spawn position, health/food, achievements, dungeon clears, player levels, Winter Ward/Castle Defense progress, chests and other saved world data**. It does **not** contain Sui wallet keys, private credentials or a new NFT.

This protects against browser storage deletion or switching phones **only if you download the backup file and keep it somewhere outside the browser**. Small automatic backup snapshots live in the same browser storage and are not a replacement for a downloaded file.

## Download a world backup on a phone

**From the world selection screen (no world loaded):**
1. Find the desired Snow World and tap **Backup** alongside its Play button.
2. Save the downloaded `flurrycraft-world-<id>.json` file to Downloads, Drive or another trusted folder. The game does not upload it anywhere.

**While a world is already open:**
1. Open the pause menu.
2. Tap **Save & Download World Backup**. It first saves the current world, then downloads its backup file. If saving fails, it does not pretend to export a newly saved world.
3. Keep the .json file outside the browser/device if you want it to survive loss of the phone.

## Restore to this or a different phone

1. Visit the same FlurryCraft website/origin where you want the world to appear.
2. On the main menu, tap **Restore World Backup (.json)**.
3. Select a previously downloaded FlurryCraft world .json file (maximum 20 MB).
4. The game validates the format, seed, inventory, coordinates and saved block edits, and imports it into a **new, unique world slot**. It never overwrites an existing save.
5. Find the imported world in the list and press **Play**.

The backup retains the saved mode, progress and map. Imports are local only. If the browser has insufficient free storage, import fails with an error; the original worlds are left untouched.

## Existing automatic backups

- Autosaves run every 30 seconds while a world is playable; the pause **Save World** button now reports success only when saving actually works.
- Valid previous saves may be retained as best-effort rolling backups if their serialized size is 1.2 million characters or less.
- A damaged current save can fall back to a stored valid previous snapshot, but this is not guaranteed (especially on a full device).
- If the browser is out of space, FlurryCraft prefers the primary save and may discard the optional local backup to complete a new save.
- World deletion removes its world data and companion automatic local backup. An external downloaded file remains available for later import.

## Security and constraints

- Restore accepts only the FlurryCraft world backup format `flurrycraft-world-backup-v1`; it does not execute scripts or import NFT/wallet records.
- Saved world metadata is HTML-escaped on the world list, so names are not treated as markup.
- The JSON file may reveal names you chose, builds and world coordinates; share it only if you're comfortable with those details being visible.
- Don't edit the JSON manually or merge another person's file into a live world.
- A backup does not synchronize progress across phones automatically. Restore is a **snapshot**, not multiplayer or cloud sync.
- Local browser storage and the website origin still determine which worlds are displayed.

## Test plan

The automated world-save tests cover:
- Portable backup roundtrip, including Abyss Blade inventory, chest contents, castles, dungeon clears and achievements
- Unique slot import without overwriting the original world
- Rejection of malformed or oversized JSON, unsafe world edits, invalid slot names and unknown formats
- Recovery from a damaged primary save while leaving it intact
- Backup throttling and browser-quota fallback

**Pending physical Android testing:** Downloads access, browser file picker, low-storage conditions, scene restoration after importing, and file exchange between two devices.
