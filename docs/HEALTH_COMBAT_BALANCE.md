# FlurryCraft — Survival Health & Combat Balance (18 November 2026)

**Status:** Source-code implementation committed to `main`. Simulated JavaScript integration/pure-logic checks passed; GitHub Actions `npm test`, real phone/WebGL visual QA and human difficulty playtests must still be checked.

## Player HP grows with level

| Player level | Max HP | Hearts at full health |
| ---: | ---: | ---: |
| 1 | 24 | 12 |
| 5 | 26 | 13 |
| 10 | 28 | 14 |
| 20 | 32 | 16 |
| 30 | 36 | 18 |
| 50 | 44 | 22 |
| 65 and above | 50 | 25 |

The base is 24 HP. **Every five adventure levels adds two maximum HP**, capped at 50 at Level 65. Combat damage bonuses remain +0.75 melee power every five levels, capped at +4.5 at Level 30. Levels 31–100 are not additional story chapters yet: new dungeons above Level 30 are still planned.

Each time a character crosses a five-level health milestone, the game **adds only the extra capacity** to current health rather than healing all existing wounds. For example, a Level 4 player at 11/24 HP who reaches Level 5 becomes 13/26 HP, not 26/26. The higher cap is derived from saved adventure level; no XP or level reset occurs.

### Healing, HUD and respawn

- The Survival health panel displays `current HP / level-scaled max HP` and correctly fills the bar; the critical-health warning uses an appropriate threshold for the larger health cap.
- The original game heart display now shows all hearts in a **compact 10-column grid**; above 20 HP, hearts occupy extra rows. Hunger stays at ten icons; the armor HUD moves above the extra rows to avoid overlap.
- The Frost Shard heal still restores 6 HP for 2 shards, with a 12-second cooldown, but can now reach 24–50 HP depending on level.
- Normal food-based regeneration can reach the same cap (it no longer stops at 20).
- Respawning restores health to the unlocked cap, not the old 20 HP.
- Creative remains unlimited/sandbox-style; this does not change existing armor durability rules or the damage bonus.

## Better monster HP scaling

The previous monster formula was `baseHP × (1 + 0.09 × (monsterLevel-1))`. This disproportionately inflated bosses in later chapters. The revised formula uses the **monster's own chapter start** and a limited step per level:

| Encounter | HP scaling | Example HP |
| --- | --- | ---: |
| Chapter 1, Levels 1–10 | +5% of base HP per level above 1 | Level 1 Frostling: 12 HP; Level 10 Frostling: 17 HP |
| Chapter 2, Levels 11–20 | +7% of base HP per level above 11 | Level 20 Blizzard Titan: 196 HP |
| Chapter 3, Levels 21–30 | +6% of base HP per level above 21 | Level 30 Boreal Sovereign: 270 HP |

An Aurora Blade does 9 base damage. With the Level 30 bonus of +4.5, it deals **13.5 normal damage** (excluding critical hits). Therefore a Level 1 Frostling takes one normal hit and a Level 30 Boreal Sovereign approximately 20 normal hits, *assuming each connects* and no additional mechanics interfere. The boss still has stronger attacks and a telegraphed second phase.

These numbers balance the number of hits, **not** the complete difficulty: movement, attack timing, armor, hunger, healing resources, crowding and mobile input responsiveness still require real playtesting. No guaranteed kills/survival are implied.

## Existing world safety

The world-save schema stays compatible. Player saves now include `player.healthCap` alongside current `player.health`. Older saves lacking `healthCap` are treated as having a **legacy 20-HP cap**. On the first load after the update, the game preserves the **amount of health missing**, so a Level 30 player who had 5/20 HP becomes 21/36 HP (still missing 15). A player at 20/20 becomes 36/36. Once saved, the new `healthCap` ensures reloading does not award additional HP again.

Structures, inventory, player level, Castle Defense, Frost Ruins, Stormspire and Aurora Citadel remain in their original per-world fields. This update does not auto-build structures or change the player's world seed.

## Device regression checklist

- [ ] New Survival world starts at 24/24 HP and the 12 hearts fit without covering the mobile buttons
- [ ] Existing worlds preserve level, inventory, structures and Ward upgrades; health migrates once and never heals again by repeatedly reloading
- [ ] Level 4 → 5 changes max HP from 24 to 26 and credits exactly 2 current HP, without fully healing injuries
- [ ] Level 10 shows 28 HP; Level 20 shows 32 HP; Level 30 shows 36 HP
- [ ] Natural regeneration continues above 20 HP when adequately fed
- [ ] Frost recovery heals up to current max HP and respects cost/cooldown
- [ ] Death/respawn starts at full unlocked HP
- [ ] Old hearts, food and armor HUD remain legible in landscape at 360–430 CSS px height
- [ ] Level 1 Frostling takes about 3 hits from a Level 1 Wooden Sword; one normal hit from a Level 30 Aurora Blade
- [ ] Blizzard Titan and Boreal Sovereign fights feel demanding but not unnecessarily long; check low-end Android FPS

**Source files:** `js/combat-progression.js`, `js/player.js`, `js/mobs.js`, `js/winter-survival-core.js`, `js/adventure.js`, `js/main.js`, `js/ui.js`, `index.html`. Test coverage includes `tests/health-balance.test.mjs`, `tests/player-health.test.mjs`, `tests/winter-survival.test.mjs` and `tests/adventure-integration.test.mjs`.
