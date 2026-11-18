# FlurryCraft Rewards Hub — playable local points, future crypto payouts

## Status — 18 November 2026

**Working in source:** world-specific Rewards Hub, one-time level milestones,
four dungeon-clear milestones, UTC daily/weekly missions, local Flurry Points,
collection history, world-save persistence, and a non-wallet player journey.

**NOT LIVE:** real token payouts, withdrawals, reward-token minting,
trusted gameplay verification, anti-bot identity, reward treasury, public
claim APIs, sponsored transactions, independently verified Sui Testnet contract,
Mainnet contracts, onchain NFT marketplace payments.

Flurry Points are **nontransferable local game points, NOT money**. Do not call
them SUI, convert them to SUI, announce a fiat value, or imply they are
redeemable. The UI deliberately disables crypto withdrawals. It does not
ask for a seed phrase, fund wallets, or sign blockchain transactions.

## Player walkthrough

1. Enter a FlurryCraft world normally; no wallet is required.
2. Use **Menu → ADVENTURE → ✦ Rewards Hub**.
3. In Survival, defeat monsters, place blocks, level up and clear dungeons.
4. Collect completed missions as **local points**.
5. Reopen the Rewards Hub to view daily/weekly progress, one-time milestones,
   points balance and local history. Each save slot has its own ledger.
6. Use the optional Sui Testnet marketplace separately to explore NFT features,
   once a verified package is deployed. NFT sale proceeds are not local points.

Creative mode intentionally does not grant local reward points from milestones.
A player never publishes a smart contract; that is a one-time developer action.

Missions use UTC dates. Daily objectives reset at 00:00 UTC and weekly
objectives reset Monday 00:00 UTC. New installs and new mission periods use
current lifetime kill and dungeon counters as the baseline, so past
achievement totals are not mistaken for fresh daily activity.

The existing world backup exporter persists the rewards ledger alongside
world progress. Older saves with no reward ledger start a fresh one.

## Reward definitions (game points only)

- Daily: defeat 3 enemies (20), place 10 blocks (25), clear one dungeon (75).
- Weekly: defeat 20 enemies (150), place 60 blocks (120), clear 2 dungeons (200).
- Levels: 10/20/30/40/50/75/100 grant 100/200/300/400/500/750/1000
  points respectively, claimed once per world.
- First clears: Frost Ruins 75, Stormspire Keep 125, Aurora Citadel 200,
  Frostbound Abyss 300.

These are **game design examples**, not advertised crypto reward amounts.
Mission counts and claims saved in localStorage can be changed by browser
devtools. The local ledger is for fun and UX testing only, not finance.

## Production crypto earning — mandatory trust architecture

A secure paid rewards system needs **all** of the following before any
player can receive a token:

1. A developer-controlled, funded treasury with a stated maximum monthly
   liability, token type, game fee budget, claim maximum, and payout policy.
2. Authenticated player profiles linked to the appropriate Sui address;
   uniqueness, privacy/age policy, abuse limits and applicable law review.
3. An **authoritative game server**, not browser localStorage or a JS token,
   that records and validates monster kill events, level progression, block
   placement and dungeon clears. For example, validate challenge seeds,
   attack cooldowns, movement limits, equipment damage, kill IDs, boss
   spawn/clear IDs, elapsed time, and signed session sequence numbers.
   Purely client-provided logs or hashes are never valid proof.
4. Persisted mission idempotency keys:
   `playerId / worldSeason / missionId / UTC-period`, with a unique database
   constraint. A second attempt to claim the same reward MUST fail.
5. Reward ledger in a transactional database. Server atomically commits
   verified mission completion, budget reservation and a claim authorization.
   Enforce daily/global caps and rate limits; hold suspicious accounts.
6. Mainnet contract that verifies an **operator-issued authorization** (or
   only accepts an authorized server-controlled transaction), recipient,
   asset, amount, chain ID, expiration, and a one-use nonce before payout.
   Verify account change, failed transactions and onchain finality; never
   credit on a submitted-but-failed digest.
7. Independent contract security review, two-wallet/testnet simulations,
   spending limits and monitoring before rolling out funded Mainnet payouts.
8. Testnet proof and faucets are **testing only**; Testnet SUI is not a
   meaningful real-income reward, and CLAY hackathon prizes are not
   automatically assigned to game players.

Wallet use should only be necessary when voluntarily receiving an actual
blockchain payment or trading an NFT. Sponsoring network fees or offering
wallet abstraction requires a separate audited implementation.

## Organizer clarification

The Lofi/CLAY hackathon's Sui ecosystem technology is the intended
development platform. The hackathon organizer is **not automatically**
the treasury, reward-token issuer, sponsor, or payer of FlurryCraft users.
Any such arrangement requires an explicit agreement, funding and published
rules. FlurryCraft does not use the organizer's brand as a promise of payouts.

## Testing

`node --test tests/rewards-core.test.mjs` tests local mission accrual,
new-period baselines, per-world isolation, one-time claims, Survival
eligibility and the permanent fail-closed cryptocurrency payout gate.
The browser and Android UX, live chain transactions and funded payouts
require separate end-to-end testing before launch.
