# Lofi Quest-Giver, Winter Navigation and Expedition Celebrations

## Gameplay
Lofi the Yeti is now an interactive 3D quest-giver standing by the existing
starter shack. His floating icon changes when a mission is available (?), in
progress (!), ready to claim (✓) or all contracts are complete (★).

- Walk within about six blocks of Lofi. A visible **Talk to Lofi** button
  appears on desktop and mobile; on desktop, press **F** instead.
- Lofi speaks about the current sequential Expedition contract and its
  actual saved progress. New missions may be accepted and finished missions
  claimed directly from his dialogue; the same action remains in
  **Menu → Rewards Hub**.
- Quest acceptance and claims share a *single Rewards Hub method*, so one
  mission cannot be awarded twice by visiting the NPC and the menu.
- Use **Menu → Find Lofi · Quest Giver** to set a genuine waypoint to his
  position. The existing world minimap shows direction and block distance.
- On the **Ruins Expedition** contract, Lofi or Rewards Hub can guide the
  player to the known Frost Ruins entrance. There is deliberately no fake
  marker for randomly spawning monsters or for buildings the player has yet
  to create.
- Accepting a mission shows a brief banner. Claiming a completed mission
  gives a larger **Expedition Complete** celebration with a small in-world
  particle burst and sound. Reduced-motion settings suppress banner
  animation. The effects do not write or modify gameplay progress.

## How progression is secured within offline-game limitations
Existing Survival eligibility, accept-before-progress counters, one-time
claim checks, world-scoped save, and Adventure XP awarding remain in force.
The NPC merely calls those existing routines. Players cannot claim rewards
from Creative Mode or while dead, and cannot interact with Lofi remotely.

**Flurry Points are local browser game points, not SUI, fiat or a
withdrawable balance.** This update includes no crypto token payouts,
NFT minting, Testnet transactions, external wallet connections or
organizer-funded rewards.

Browser saves can be edited; a trusted anti-cheat backend and funded
treasury would be needed before any legitimate financial reward system.

## Test plan
- On a new Survival save, visit Lofi, open his dialogue and accept Frost
  Patrol. Ensure the Rewards Hub shows the same accepted contract.
- Kill real winter monsters and watch progress change. When ready, claim
  via Lofi; check Adventure XP and points exactly once.
- Revisit the Rewards Hub: the same completed contract cannot be claimed.
  Reload/restore the world and check the next mission is still pending.
- Walk away from Lofi. The interaction button must disappear and F must
  no longer open the NPC. Pausing or opening inventory must hide the button.
- On mobile, use the touch button while sword guard and movement remain
  interruption-safe.
- Navigate to Lofi from the in-game menu and follow the minimap marker.
  Accept Ruins Expedition and navigate to the actual Frost Ruins entrance.
- Confirm there is no Sui transfer, NFT mint, or fake reward triggered.

The automated checks run pure quest-guide tests, shared Rewards Hub claim
integration and full desktop / Android-like Chromium gameplay smoke tests.
They do not replace a physical phone playtest.
