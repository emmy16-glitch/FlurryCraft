# FlurryCraft — Chapter 3: Aurora Citadel

**Source implementation:** 18 November 2026. This is a new four-room dungeon, three original enemy species, a two-phase boss and a real craftable weapon. GitHub Pages deployment, real browser rendering and Android gameplay still require verification.

## How to unlock

1. Enter **Survival** and progress to **Level 20**.
2. Clear **Stormspire Keep at least once**. You need *both* Level 20 and a Stormspire clear.
3. Open **Menu → Winter Adventure → Scout Aurora Citadel Site**. This searches for a dry location about 180+ blocks from spawn and at least 100 blocks from your existing Frost Ruins and Stormspire locations. Scouting **does not modify the world**.
4. Use the new **Guide to Aurora Citadel** map marker (the same existing offline minimap/navigation system).
5. When satisfied with the location, select **Build Aurora Citadel · 17 × 67 blocks** and confirm the warning. The fortress replaces any terrain or buildings inside that footprint; always inspect and back up first.
6. Approach the site so terrain chunks load. Construction uses at most **28 world edits per active frame**; the build can pause if the relevant chunks are not loaded. Return to Winter Adventure to monitor. The world saves edits as usual.
7. Stand at the northern arch, tap **Enter Aurora Citadel**, and defeat the monsters chamber by chamber.

**Important:** Existing worlds do not auto-build this structure. It is opt-in, the map marker appears before construction, and no existing building is overwritten unless you explicitly confirm construction.

## The four chambers

| # | Chamber | Enemies | Clear condition |
|---|---|---|---|
| 1 | Wisp Lantern Court | 2 Aurora Wisps | Defeat both |
| 2 | Prism Stalker Gallery | 1 Prism Stalker, 1 Aurora Wisp | Clear then move forward |
| 3 | Crystal Sentinel Hall | 2 Prism Stalkers | Clear then move forward |
| 4 | Throne of the Boreal Sovereign | 1 Boreal Sovereign | Defeat the final boss |

The game reuses the usual **Mine → Attack** mobile aiming control, target HP bar, XP progression and full-world movement. Each wave starts only after the previous enemies are defeated and you enter the next room. Ordinary hostile spawning is paused during the active dungeon to prevent surprise interference. Walk in and out without teleporting.

## New enemies

- **Aurora Wisp (Level 21–30):** Original hovering luminous creature with a rotating halo. Drops Aurora Crystals and Frost Shards.
- **Prism Stalker (Level 24–30):** Four-legged, angular crystal beast with bright crests. Drops Aurora Crystals and Froststone.
- **Boreal Sovereign (Level 28–30):** Crowned boss with an aura core, large silhouette and a clearly telegraphed aurora pulse. Below **50% HP**, its pulse gets bigger, charges faster and repeats more often. The pulse is dodgeable by moving away and needs line of sight.

New enemies can also roam the snowy overworld once the relevant level thresholds are reached. The original Chapter 1/2 enemies and their level caps remain unchanged.

## Equipment, materials and loot

Aurora Crystals are item ID **279**, with their own purple/cyan inventory artwork. The new **Aurora Blade** is item ID **324**, a durable sword with **9 base weapon damage**, greater than the existing Diamond Sword. It has a distinctive pink/cyan blade icon, works with the existing weapon/equipment system and does not need a blockchain wallet.

**First clear:** 1 Aurora Blade, 5 Aurora Crystals, 12 Frost Shards, 28 Froststone Bricks and 370 completion XP, in addition to ordinary monster drops and XP. If a player's inventory is full, the game drops unclaimed rewards beside the player.

**Repeat clears:** 5 Aurora Crystals, 12 Frost Shards, 28 Froststone Bricks, 370 completion XP and ordinary enemy rewards. The first-clear Aurora Blade is not duplicated.

**Craft an additional Aurora Blade:** Combine a **Diamond Sword + 2 Aurora Crystals + 1 Frost Shard**, shapeless, using a 2×2 or larger crafting grid. The ingredients create an actual weapon, not merely a cosmetic.

## Saving and old-world compatibility

This expansion adds the small `adventure.aurora` object to the existing **per-world save**:

```json
{
  "site": {"x": 186, "y": 44, "z": 16},
  "built": true,
  "version": 1,
  "clears": 1
}
```

This is an illustrative structure, not coordinates assigned to every user. The actual site depends on the saved world seed and spawn location.

Old worlds are migrated on load to `site:null`, `built:false`, `version:0`, `clears:0`. Existing buildings, Frost Ruins, Stormspire clear records, XP, inventory, Winter Ward upgrade tiers, Castle Defense stats and map pins are retained in their original fields. Active dungeon fights are intentionally transient and reset cleanly upon reloading; already completed clears persist.

## Android regression checklist

- [ ] Existing worlds load without an Aurora Citadel and all previously placed blocks and Ward tiers remain present
- [ ] Chapter 3 is locked at Level 19, or at Level 20 without a Stormspire clear
- [ ] Scouting alone only places a map marker and does not change terrain
- [ ] Confirmation warns of the **17 × 67** footprint; do not build over houses
- [ ] Travel to the site and allow the fortress to finish building as chunks load; verify performance on render distance 3–4
- [ ] The north-gate prompt appears only when close to the Citadel and disappears if you move away or open a menu
- [ ] All **four** waves spawn the correct enemies and require actual room entry to progress
- [ ] The Wisp floats, the Stalker walks with its legs and the Sovereign's boss model animates without missing geometry
- [ ] The Sovereign pulse gives a warning; test dodging at full and below-half health
- [ ] Existing Android Mine/Attack button continues to work for all three monsters
- [ ] First clear rewards the weapon and materials; second clear never duplicates the free sword
- [ ] Find the Aurora Blade in inventory, equip it and verify weapon damage and durability
- [ ] Craft an additional Aurora Blade using the Diamond Sword + 2 Crystals + Frost Shard recipe
- [ ] Save/exit/reload: location, construction and clears persist; active monsters from the abandoned trial do not
- [ ] Frost Ruins, Stormspire Keep and Castle Defense remain usable

## Verification

JavaScript source syntax was checked and a simulated JavaScript suite exercised the four-room structure, room triggers, XP rules, boss phase thresholds, recipe registration, legacy saves, repeat-clear rewards and older chapter regressions. **Full `npm test` in GitHub Actions, WebGL graphics and real-device gameplay have not been independently verified in this session.** No wallet connection, multiplayer, cloud save or on-chain transactions were added.
