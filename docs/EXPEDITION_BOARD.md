# FlurryCraft Expedition Board — mission-to-reward adventure loop

## Player journey

1. Enter a **Survival** world and open **Menu → Rewards Hub**.
2. Find **Expedition Board** before ordinary Daily and Weekly missions.
3. Press **Accept Expedition** to begin the current contract. Previously earned kills, completed dungeons and placed blocks do not count retroactively.
4. Complete the objective through actual gameplay. A small click-to-open Expedition tracker displays progress while exploring; it hides when paused, in a dialog, or in Creative Mode.
5. Open Rewards Hub and tap **Claim Expedition Reward** when complete. The claim credits local Flurry Points plus bounded Adventure XP, helping the level bar and future dungeon unlocks.
6. The next contract unlocks only after claiming the previous contract. Each contract can be claimed once per world, surviving save/reload and backup restore.

## Four sequential expedition contracts

| Contract | Objective counted after accepting | Reward |
|---|---|---|
| Frost Patrol | Defeat 3 winter creatures in Survival | 35 Flurry Points, 45 XP |
| Build a Winter Shelter | Place 12 blocks yourself in Survival | 45 Flurry Points, 55 XP |
| Ruins Expedition | Clear 1 winter dungeon in Survival | 90 Flurry Points, 130 XP |
| Winter Veteran | Defeat 10 more winter creatures in Survival | 110 Flurry Points, 140 XP |

Kill and dungeon stats come from Adventure's genuine Survival-only progress events. Building uses the existing player placement recorder, which counts actual Survival placements near the player, not automated blueprints. Daily, Weekly, and Level/Dungeon milestones remain separate.

**Important:** Flurry Points are **local game points only — not crypto**. Browser saves can be modified; there is no funded treasury, independent mission verification backend or enabled cryptocurrency payout. These contracts do not send SUI, mint NFTs or create withdrawable balances.

## Save and safeguards

The expedition ledger is optional in existing world-scoped Rewards Hub saves. Legacy worlds start with no accepted expedition but retain points and existing claimed rewards. Only the expected next contract may be accepted; completed IDs must be a strict ordered prefix. Counters are bounded. Missions cannot be started or claimed in Creative Mode, and duplicate claims fail.

The Adventure awardExpeditionXP method accepts only a bounded positive integer with an active, living Survival player, and routes through the normal level-up/max-HP logic.

## Keyboard shortcut fix

Sword Guard uses **G** on desktop. The old Blocks catalog shortcut also used G, conflicting with defense. Blocks now opens with **N** (or the visible Blocks button); G is reserved for guarding.

## Validation checklist

- [ ] Accept Frost Patrol in Survival, confirm 0/3
- [ ] Defeat 3 real Frostlings, claim 35 points and 45 XP
- [ ] Reload: completed contract stays completed
- [ ] Place 12 blocks yourself; auto-blueprint builds do not count
- [ ] Clear a winter dungeon after accepting Ruins Expedition
- [ ] Creative Mode cannot accept/claim; tracker stays hidden
- [ ] Pause, background, rotate mobile: no stuck movement or misplaced tracker
- [ ] Hold G while equipped with a sword: Guard works, Blocks does not open
- [ ] No token minting, wallet transfers, or cryptocurrency payout claims

Automated tests cover pure mission state, local rewards, Adventure XP
integration and Chromium UI acceptance. Real-phone UX/performance testing is
still needed.
