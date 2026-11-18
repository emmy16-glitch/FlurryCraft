# Lofi's Winter Trials — defensive skill and winter exploration

This update adds repeatable **skill-based Survival objectives** alongside the existing
four-stage Expedition Board, ordinary Daily/Weekly missions, and chapter milestones.

## How to play
1. Enter a **Survival** world. The starter shack provides a wooden sword.
2. Talk to **Lofi the Yeti** near the shack (press **F** on desktop or tap
   **Talk to Lofi** on mobile). Choose **❄ View Winter Trials**. You can
   also open **Menu → ✦ Rewards Hub** directly.
3. **Perfect Parry:** face a winter enemy with a sword equipped. Hold **G**
   on desktop or the **GUARD** touch button. Raise the sword in the first
   **0.22 seconds** before an incoming frontal melee/arrow attack to earn
   one real Perfect Parry. Ordinary blocks, environmental damage, side hits,
   invulnerable second hits and Creative Mode do not earn trial progress.
4. **Explore:** walk or sprint on foot in a Survival world. Distance comes
   from actual physics-resolved X/Z movement; flying, swimming, idling,
   teleport-like jumps, bad frame-time spikes, paused/hidden tabs and
   Creative Mode do not earn exploration credit.
5. Return to the Rewards Hub to collect a completed mission's **local
   Flurry Points**. These trials do not automatically issue points or XP.

## Objectives and rewards

| Trial | Goal | Local Flurry Points |
|---|---|---:|
| Daily Sword Trial | Perfect Parry 2 attacks | 45 |
| Daily Trail Trial | Explore 120 blocks on foot | 40 |
| Weekly Sword Trial | Perfect Parry 12 attacks | 190 |
| Weekly Trail Trial | Explore 850 blocks on foot | 180 |

Daily trials reset at **00:00 UTC**. Weekly trials reset on **Monday at
00:00 UTC**, independent of the existing Expedition Board. A claim is
allowed only once for each day's or week's goal. Claim history and total
points remain in the normal world-scoped Rewards Hub save.

## Animation and performance
Walking on snow/ice may briefly kick up two (touch) or four (desktop)
snow particles at most once per eight blocks, using the existing particle
system. This is cosmetic and does not increase world-generation work.

On-foot distance is validated per physics frame, collected into small
batches, then written to the in-memory mission ledger, rather than
serializing a world every frame. Closing a world, normal autosave or opening
Rewards Hub serializes any buffered progress. Only genuine Perfect Parry
combat events update the parry ledger. No interval/network polling is added.

## Backward compatibility and safety
Older saves continue to load with their previous Flurry Points, Expedition
progress and claims. Missing Winter Trial counters default to zero. New
counters are capped and sanitize malformed values. Movement counters reset
between worlds. The wallet bridge and all Sui contract state are unchanged.

**Local Flurry Points are not SUI, crypto or withdrawable assets.**
Browser-based gameplay is not tamper-proof; these checks improve honest game
logic, not blockchain-grade proof. No funded reward treasury, server-side
anti-cheat, account verification or on-chain claim service exists yet.

## Verification checklist
- [ ] Meet Lofi and open the Winter Trials directly.
- [ ] Perfectly parry two real enemy attacks, verify 2/2 and claim once.
- [ ] Confirm rear, unguarded, environmental or ordinary blocked hits do
      not advance the Sword Trial.
- [ ] Explore on foot: watch the Trail Trial update as you move.
- [ ] Fly or teleport in Creative: exploration progress does not advance.
- [ ] Pause or background the game: counters stop.
- [ ] Reload or restore a world backup: progress and claims remain.
- [ ] Switch worlds: no cross-world travel/progress leaks.
- [ ] Observe that optional snow-step particles remain lightweight on mobile.
- [ ] Validate no wallet signature, Testnet transfer, NFT mint or crypto payout.

The CI suite checks gameplay rules, real Player.hurt parry events, UI ledger
isolation and Chromium desktop/mobile-landscape movement. These tests do
not replace a physical phone performance and usability evaluation.
