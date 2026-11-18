# FlurryCraft — Chapter 4: Frostbound Abyss

**Implementation:** 18 November 2026; source implemented on `main`. The simulated test suites passed, but the actual GitHub Pages deployment, WebGL rendering and Android gameplay have **not** been independently verified.

## Overview

Frostbound Abyss is a real fourth dungeon chapter covering **Levels 31–40**, following Frost Ruins (1–10), Stormspire Keep (11–20) and Aurora Citadel (21–30). It is an original **19 × 75-block** four-room fortress with a broad, tall walking passage and dark violet/ice decorative towers. It contains two distinct new monster types and a new end boss.

### Unlock and construction

1. Play a **Survival** world, reach **Level 30**, and clear **Aurora Citadel** at least once. Both milestones are required.
2. Open **Menu → Winter Adventure** and choose **Scout Frostbound Abyss Site**. Scouting checks several terrain locations approximately 260+ blocks from spawn and at least 105 blocks from existing dungeon sites. Scouting changes **no blocks**.
3. Tap **Guide to Frostbound Abyss** and inspect the marked area before proceeding.
4. Select **Build Frostbound Abyss · 19 × 75 blocks** and explicitly confirm the overwrite warning. **Construction can replace existing terrain and player builds inside this footprint**, so back up any valuable world first.
5. Walk near the site to load terrain. Building performs no more than **28 block edits per active frame**, and pauses if a required chunk is unloaded.
6. Approach the **Rift Gate** at the northern arch and tap **Enter Frostbound Abyss**. Advance by clearing one chamber and then physically walking into the next. The game doesn't teleport you.

No new or existing world auto-creates Frostbound Abyss. Unfinished construction is transient: if you quit mid-build, return to Winter Adventure and **prepare the dungeon again after checking the area**. Previously edited blocks remain in the world.

## Four chambers and actual fights

| Room | Enemies | Battle objective |
|---|---|---|
| 1 — Crevasse Gate | 2 Rift Stalkers | Defeat both fast quadrupeds |
| 2 — Umbral Hunting Grounds | Umbral Sentinel + Rift Stalker | Defeat both |
| 3 — Obsidian Sentinel Vault | 2 Umbral Sentinels | Defeat both armored sentinels |
| 4 — Heart of the Abyss | Abyss Keeper | Defeat the final boss |

**Rift Stalker:** A dark-blue, horned, four-legged ice creature with exposed crystal spines. Appears from Level 31. Drops Abyss Crystals and Frost Shards.

**Umbral Sentinel:** A taller violet armored construct with a glowing front core and distinct shoulder/helmet features. Appears from Level 34. Drops Abyss Crystals and Froststone.

**Abyss Keeper:** A tall, crowned end boss available at Level 38+. It has an original dark-ice model, glowing heart, distinct shoulders and a telegraphed **Rift Shockwave**. Below **45% HP**, the pulse becomes larger, slightly stronger and faster, but still takes time to charge. Back away to dodge, or break line of sight. It does **not** blast through dungeon walls. The current fight retains the usual walking melee mechanics and attack telegraphs.

Other chapters' monsters still exist and can be fought in the open world. Rift monsters can begin appearing in the snowy overworld when the corresponding player level unlocks them. Their monster level is capped at **40**.

## Equipment and rewards

The fourth chapter introduces two **actual inventory items**, not decorative blocks:

- **Abyss Crystal** (item ID **325**): violet-blue loot material with original pixel-art inventory icon, dropped by Chapter 4 monsters.
- **Abyss Blade** (item ID **326**): a **real wielded low-poly 3D sword** with a purple crystalline blade, decorated crossguard, ridge, pommel, original inventory icon and attack animation. It deals **11 base sword damage**, stronger than the Aurora Blade's 9, and has **590 durability**. The same held-weapon system displays it in first and third person.

**First clear:** 1 Abyss Blade, **7 Abyss Crystals**, **16 Frost Shards**, **36 Froststone Bricks**, and **520 XP** plus enemy drops and kill XP.

**Repeat clears:** 7 Crystals, 16 Shards, 36 Bricks, 520 XP, plus normal monster rewards. The free Abyss Blade is not duplicated.

**Craft another Abyss Blade:** Place **1 Aurora Blade + 2 Abyss Crystals + 1 Frost Shard** in the crafting grid (shapeless four-item recipe). These materials produce a real wieldable weapon, not a building block.

Frost Shard healing, hunger, armor, the mobile Attack button, XP rewards and level-scaled health work as before. Level 40 characters have **40 max HP**, with higher weapon damage than early chapters. The boss is scaled within the Chapter 4 level range, avoiding the old runaway enemy-HP formula.

## Saves and compatibility

The existing per-world `adventure` save adds a small `abyss` object:

```json
{"site":null,"built":false,"version":0,"clears":0}
```

The site field becomes a bounded `{x,y,z}` object after scouting. Old save files automatically receive empty Chapter 4 progress without replacing any prior fields: XP, level, health, inventory, buildings, beacons and Ward tiers, Castle Defense wins/losses, Frost Ruins, Stormspire and Aurora remain as before.

**Active dungeon waves aren't saved**, and monsters from an interrupted trial are cleaned up on reload. Completed clear counts and awarded items persist normally when the world is saved. Reloading during a run doesn't grant a fake victory.

## QA checklist for a real Android phone

- [ ] Resume an old saved world; existing world terrain, gear, HP, Wards and prior dungeon progress remain
- [ ] Level 29 + Aurora clear stays locked; Level 30 without Aurora clear stays locked
- [ ] Level 30 + an Aurora clear reveals the Scout button
- [ ] Scouting marks the map without editing a single block
- [ ] Building requires explicit confirmation and warns about the whole 19 × 75 footprint
- [ ] The structure builds gradually as chunks load with no serious Android frame-rate collapse
- [ ] Enter at the northern gate; one button starts the trial only near the site
- [ ] Fight all four waves; room-to-room entry is required before the next enemies spawn
- [ ] The Stalker uses quadruped movement; Sentinels and Keeper animate as humanoids
- [ ] The Keeper warns before its close-range shockwave, and the 45%-HP phase change works
- [ ] The Rift Shockwave is dodgeable and blocked by walls
- [ ] The first victory yields one Abyss Blade, materials and XP
- [ ] Subsequent victories yield materials but don't duplicate the free sword
- [ ] Equip the Abyss Blade; verify its 3D shape in first- and third-person and the actual 11-damage weapon stats
- [ ] Craft another Blade using the Aurora Blade + 2 Abyss Crystals + 1 Frost Shard
- [ ] Save/reload after a completed victory; all records and gear persist
- [ ] Reload midway through a battle; abandoned enemy entities vanish safely and no fake clear is recorded
- [ ] Confirm Chapters 1–3, Winter Ward construction, Castle Defense and HP progression still work

## Verification

**66 simulated tests across Chapter 4 and earlier progression/integration groups passed, with no gameplay assertion failures.** Nine changed JavaScript files passed separate syntax checks. One first attempt at combining the older Stormspire test with a duplicate test-scoped variable produced a temporary harness-only naming conflict; the five Stormspire tests were rerun separately and passed. These are not a substitute for a full repository `npm test` run, real 3D WebGL QA, or verified live GitHub Pages deployment.
