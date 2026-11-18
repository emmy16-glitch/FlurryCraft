# FlurryCraft Castle Defense — November 18, 2026

Status: **Source-implemented** on `main`. GitHub Actions deployment and physical-device graphics/combat checks must still be verified. No wallet or blockchain integration was added.

## What changed

Winter Wards now provide upgradeable castle defense. The basic Winter Ward from Frost Ruins starts at **Tier I**. Each higher tier has a larger protected area, more shield integrity during raids and stronger automatic attacks against monsters. Defenders can voluntarily start a three-wave siege from Winter Adventure. The attackers pursue the **Ward shield**, not a player hiding in its protective area, and the player can assist by fighting them with normal mobile/desktop combat.

**No raid breaks or mines player-built blocks.** The ward block and its level remain after a shield-defeat, and all raids are opt-in. Regular overworld monsters still exist, and the ward can target them while active, but random overworld spawning is paused during a controlled siege so the trial cannot accidentally flood the player's phone.

## Ward tiers

| Tier | Unlock and upgrade cost | Radius | Auto-attack | Siege shield |
|---|---|---:|---:|---:|
| I | Craft with 5 Shards + 12 Froststone or earn from Frost Ruins | 10 blocks | 2 damage every 2.2 seconds | 45 integrity |
| II | Level 10, 8 Shards + 16 Froststone | 13 blocks | 4 damage every 1.5 seconds | 70 integrity |
| III | Level 15, at least one Stormspire clear; 16 Shards + 32 Froststone | 16 blocks | 6 damage every 1.1 seconds | 100 integrity |

All Ward attacks use a limited attack range (13, 17, or 21 blocks respectively), require line of sight when the world's raycasting system is available, and avoid passive creatures. Attacks create a small cyan burst rather than heavy particle effects. Automated tower kills drop normal loot but **do not award player kill XP**.

## Playing Castle Defense

1. Enter a **Survival world**, reach **Level 5** and clear **Frost Ruins at least once**.
2. Place your Winter Ward near the castle you want to defend. Open **Menu → Winter Adventure → Castle Defense**.
3. Stand within 16 blocks of the Ward. The panel lists nearby active Wards, their tier, coordinates and damage. Upgrade only if you meet the material and level requirements.
4. Tap **Start Defense Trial**, then confirm. Monsters arrive in three waves and approach the selected Ward. Attack with your equipped sword (same mobile Mine/Attack button), or let your Ward contribute automatic damage. You must defeat each wave to begin the next.
5. During battle, the on-screen defense panel shows current wave and remaining **Ward shield integrity**. Tap **Repair Ward** to spend **2 Frost Shards + 4 Froststone**, restoring **22 integrity** (up to maximum), with a 1.5-second repair cooldown.
6. Clear all three waves for a victory and your reward. If the shield reaches zero, you leave the Ward area, die, remove the Ward or voluntarily retreat, you lose the trial. **Your blocks and Ward upgrades remain untouched.**

## Waves and rewards

| Ward tier | Wave 1 | Wave 2 | Wave 3 | Completion reward |
|---|---|---|---|---|
| I | 2 Frostlings | Snow Prowler + Frostling | Glacier Guardian | 4 Shards, 10 Froststone, 75 XP |
| II | 2 Storm Hounds | Rime Knight + Storm Hound | 2 Rime Knights | 7 Shards, 16 Froststone, 145 XP |
| III | Storm Hound + Rime Knight | 2 Rime Knights | Blizzard Titan | 11 Shards, 24 Froststone, 240 XP |

Normal enemy loot also drops. Completing a raid increments the per-world victory total and best tier; failing increments losses. Defenders must remain within 29 horizontal blocks of the Ward while the raid is active.

## Compatibility and saving

The existing `adventure.beacons[]` records gain a sanitized `tier` field; old entries without a tier become Tier I automatically. The existing save gains a small `adventure.castle` object with **wins, losses, bestTier and version**. Combat waves, Ward shield integrity and projectile timers are intentionally **temporary** and are never resumed after reloading. Abandoning/reloading a run does not silently destroy or replace blocks, nor does the reload count as a second loss. Survival XP, Frost Ruins, Stormspire, player buildings and building blueprints remain in their original save fields.

## QA checklist for Android

- [ ] Reopen old Survival saves; existing Winter Wards remain Tier I and keep the same coordinates and protection
- [ ] Ensure `Menu → Winter Adventure → Castle Defense` appears without covering unrelated menus
- [ ] Confirm upgrades consume the listed amount and require their unlock milestones
- [ ] Check a Ward protects the larger area after an upgrade, including after saving and reloading
- [ ] Verify Ward pulses hit only hostile creatures in range and do not pass through walls
- [ ] Start a Tier I siege: monsters should physically move toward your Ward, not idle near spawn
- [ ] Verify the three attack waves, Ward shield decrease, successful repair action and win reward
- [ ] Verify Tier II and III use their distinct Stormspire monster rosters and reward amounts
- [ ] Test shield defeat, leaving the area, player death, Ward removal and voluntary retreat without losing player-built blocks
- [ ] Save/quit/reload while a raid is active; only persistent progress and upgrades should survive
- [ ] Check performance on modest Android devices at render distance 3–4 and no excessive particle/AI load
- [ ] Confirm that both Frost Ruins and Stormspire dungeons are still enterable and playable

## Verification status

JavaScript source checks and a simulated test suite (ward tiers, upgrade costs, siege waves, victory/loss conditions, shield repairs, XP rules, save/load compatibility and earlier dungeon checks) passed during this implementation. These checks do **not** substitute for the repository's Node/GitHub Actions test run or real in-browser visual testing.
