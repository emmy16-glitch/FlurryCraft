# FlurryCraft roadmap — implemented vs planned

## Phase 1: source-code foundation — committed

- Import the upstream MIT voxel engine with bundled Three.js.
- Adapt world generation toward snowy biomes.
- Add custom blocky Yeti avatar with selectable colors, winter hat and camera toggle.
- Add introductory Lofi quest, a small generated starter shack and quest HUD.
- Add local blueprint JSON saving/importing to support future creator NFTs.
- Add automated GitHub Pages deployment and JavaScript smoke tests.

## Limitations to fix after mobile testing

These implementations have been syntax checked, not verified visually on an Android phone yet. Third-person placement reticle may not align perfectly with the block target; build in first person for precision. Quest progress is per-browser, not per-world. Fixed-size blueprints may include natural terrain blocks in the captured volume. Starter shack uses existing blocks; more furniture and doors are needed. Avatar is original simple geometry, not final character artwork. Browser saves are not synchronized or protected against loss. Touch layouts need device QA and optimization.

Performance goals (not benchmarks): smooth 30 FPS on modest Android phones and 60 FPS on capable phones. Lower render distance, chunk budgets and shader complexity as necessary after profiling.

## Phase 2: game polish

- Precise camera targeting, full character editor, animations, warm clothing, snowstorm survival.
- Implemented first house pack: doors, windows, low-poly table/chair/bed/fireplace.
- Next: full two-high doors, rotation and expanded furniture, blueprint area selection and hologram placement preview.
- Expand NPC conversations, quests, world progression and creator building tools.
- Validate high/medium/low Android configurations.

## Phase 3: Sui Testnet creator market

Players build → capture a normalized 3D blueprint → store its hash and content → mint a Sui NFT representing edition/ownership → list → buy → verify current ownership → install a full building in-game. Need reviewed Move contracts, wallet connection, marketplace transaction handling, asset integrity, anti-spam checks and storage. Use Testnet before any mainnet or fee.

Design choice: unlimited placement while holding the blueprint NFT, subject to an explicit creator license. NFTs do not automatically convey copyrights or prevent copying. No sale or income is guaranteed.

## Phase 4: production launch

- Optional marketplace fees (example proposed 5%, not implemented).
- Legal and brand/IP review, age/payment requirements and creator moderation.
- Audit contracts and backend authorization, abuse prevention, backups and reporting.
- Multiplayer or cloud save only if properly supported by a secure service.
