# CLAY Hackathon III — FlurryCraft submission pack

This draft must be checked against the actual deployed game before you submit.
Never claim an NFT sale, Walrus upload, crypto payout, or winning result that
has not been independently demonstrated.

## Competition and verified checklist

Organizers: Lofi the Yeti / CLAY, **Code Like a Yeti**.
Official site: https://hackathon.lofitheyeti.com/
The organizer's 16 November 2026 announcement describes a Lofi mini-game
category and a round running through the end of 2026. Always check its latest
rules before final submission.

The official website's checklist requests:
- Project name, concise description and **square (1:1) JPG/PNG logo**.
- Public GitHub repository.
- **Demo video: maximum 3–5 minutes; YouTube preferred.**
- Website strongly recommended (but optional).
- On-chain Package ID optional, only when a contract is actually published.
- Team lead name, contact email and contact handle.

The website does NOT publish a numerical judging rubric; do not invent one.

## Project title

**FlurryCraft — Lofi's Winter Adventure**

## Concise project description — submission form

FlurryCraft is a playable, browser-native snowy voxel adventure featuring Lofi
the Yeti. Players explore a winter world, construct castles, battle ice
creatures, challenge four dungeon chapters and complete missions.
Creator Studio lets players save and preview reusable building blueprints.
The optional Sui Testnet integration demonstrates an experimental
self-custodied Move NFT marketplace, while Walrus Testnet can store a
creator-approved public blueprint with content integrity checks. A
nonredeemable Flurry Points hub showcases progression without pretending that
browser scores can be withdrawn as cryptocurrency. The mini-game runs
without a wallet; blockchain features are optional and clearly labelled.

## Public submission links

- Repository: https://github.com/emmy16-glitch/FlurryCraft
- Website: https://emmy16-glitch.github.io/FlurryCraft/
- Move source: move/flurrycraft/sources/market.move
- Developer guide: docs/SUI_TESTNET.md
- Walrus guide: docs/CLAY_SUI_STACK_READINESS.md
- Rewards transparency: docs/REWARDS_HUB.md
- Demo video: **RECORD AND UPLOAD ACTUAL GAMEPLAY; INSERT LINK**
- Project logo: **SUPPLY A FINAL 1:1 JPG/PNG; existing Yeti art is assets/yeti-guide.svg**
- Package ID: **LEAVE BLANK** until published on Sui Testnet and independently verified.

## Four-minute live demo script

The guided tour is a **navigation helper**. It does not simulate the gameplay.
Record real interaction and trim idle/loading time in your editor.

| Approx. time | What you show | What to say |
|---|---|---|
| 0:00–0:25 | Game title, click **Try Guided Adventure Demo** | “FlurryCraft is Lofi's playable winter survival-and-creation world. No wallet is required to start.” |
| 0:25–1:05 | First-person movement, meet Lofi and his starter shack; use starter sword against an enemy if one appears | “It has real world exploration and frost enemies, not a mock screen.” |
| 1:05–1:45 | **Menu → Winter Adventure**, actual XP/chapter overview and a dungeon entrance, if accessible | “There are four progressive dungeon chapters with enemy AI and loot. I won't pretend to have cleared a chapter in this new save.” |
| 1:45–2:25 | Open Blocks, place building pieces, use Walls & Floors, show a real reusable saved blueprint | “Building is the second pillar: create, reuse, preview and save custom structures.” |
| 2:25–2:55 | Open Rewards Hub and show real missions, local point claim if earned | “Missions and milestones are playable. Local Flurry Points are not cryptocurrency.” |
| 2:55–3:30 | My Builds, saved designs, Walrus Testnet share/import receipt if a real endpoint works | “Walrus adds opt-in public storage; hashes detect unexpected changes. I only describe successful uploads if the live request really succeeds.” |
| 3:30–4:00 | Sui Testnet UI, GitHub Move contract/tests; display verified package ID **only if deployed** | “Our Move NFT escrow contract compiles and tests. NFT trading requires the real verified Testnet deployment; no fake mint or sale is shown.” |

If a wallet is unavailable, **don't stall** the video. Demonstrate the
working game and verifiable source/tests. The organizers mark a Package ID
as optional. A genuinely published Testnet package with a successful
two-wallet mint/list/buy/cancel walkthrough strengthens the entry when available.

## Judge's quick-start

1. Open the website on a modern WebGL-capable browser.
2. Tap **▶ Try Guided Adventure Demo** on the welcome screen.
3. Use on-screen joystick and look controls on mobile, or mouse and WASD
   on desktop. Follow the small six-step guided tour at the screen edge.
4. Tap “Explore feature” to open real Adventure, Blocks, Rewards Hub,
   Creator Studio and Sui Testnet interfaces. Close dialogs to continue.
5. **X** closes the tour; **Menu → Adventure → ▶ Guided Tour**
   reopens it at step one.
6. Demo creates a normal, separate Survival save: other worlds are preserved.
   World backup and restore are available if browser storage is cleared.

## Before submission — acceptance checklist

- [ ] Public website loads and starts a real world on desktop and Android.
- [ ] Test all six guided-tour steps and close / reopen behavior.
- [ ] Verify keyboard, touch look/attack, block placement and sound.
- [ ] Check dungeon entrance, combat damage, death and respawn in Survival.
- [ ] Save, reload, export backup and restore without losing original world.
- [ ] Capture a **real** 3–5 minute video without fake transactions or fake claims.
- [ ] Provide square logo PNG/JPG and a clear thumbnail.
- [ ] Verify Walrus Testnet upload and import receipt with live endpoint if demonstrated.
- [ ] Publish Move with the owner's wallet only; verify source on Sui Testnet.
- [ ] If published, record exact package ID and live explorer proof, test two wallets.
- [ ] Do not claim local Flurry Points are valuable or redeemable.
- [ ] Fill the official submission form and keep the confirmation email.

## What makes FlurryCraft distinctive

1. **Playable first:** winter terrain, builder tools, actual combat and
   four escalating chapters rather than an NFT storefront with no game.
2. **Lofi-centered:** Lofi acts as an in-world Yeti guide and the demo starts
   with the world/story rather than a wallet.
3. **Creator-first Sui Stack:** practical local blueprints, optional public
   Walrus storage and source-available Move NFT escrow experimentation.
4. **Realistic Web3 onboarding:** optional wallet, Testnet segregation,
   source verification gate, no false crypto payout promises.
5. **Easy judging:** a one-click, dismissible tour explains the real
   controls, accomplishments and technical status within a few minutes.

This is a pitch and demonstration guide, **not a representation of
hackathon organizer approval or an independently audited smart contract**.
