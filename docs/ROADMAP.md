# FlurryCraft roadmap — implemented vs planned

## Phase 1: source-code foundation — committed

- Import the upstream MIT voxel engine with bundled Three.js.
- Adapt world generation toward snowy biomes.
- Add custom blocky Yeti avatar with selectable colors, winter hat and camera toggle.
- Add introductory Lofi quest, a small generated starter shack and quest HUD.
- Add local blueprint JSON saving/importing to support future creator NFTs.
- Add automated GitHub Pages deployment and JavaScript smoke tests.

## Limitations to fix after mobile testing

These implementations have been syntax checked, not verified visually on an Android phone yet. Third-person placement reticle may not align perfectly with the block target; build in first person for precision. Quest progress is per-browser, not per-world. Selected blueprints may include natural terrain blocks inside the chosen bounds. Starter shack uses existing blocks; more furniture and doors are needed. Avatar is original simple geometry, not final character artwork. Browser saves are not synchronized or protected against loss. Touch layouts need device QA and optimization.

Performance goals (not benchmarks): smooth 30 FPS on modest Android phones and 60 FPS on capable phones. Lower render distance, chunk budgets and shader complexity as necessary after profiling.

## Phase 2: game polish

- Precise camera targeting, full character editor, animations, warm clothing, snowstorm survival.
- Implemented first house pack: doors, windows, low-poly table/chair/bed/fireplace.
- Winter World 2.0: softened two-layer particles, wind gusts and frosty terrain textures, configurable storm intensity in Menu → Weather, plus adaptive snow budget on slower devices.
- Explorer Map: offline incremental map, home and spawn pins, eight world-specific markers, zoom and an optional guidance arrow; no new map permissions or network requests.
- November 18 mobile review: source-implemented live HP/food HUD, 2-shard emergency recovery with 12-second cooldown, more readable winter enemy spacing, raised spruce boughs, less intense red vignette, compact touch hotbar and a small night visibility lift. Real Android regression verification remains pending.
- Winter Adventure: Level 1–100 XP curve and **three source-implemented chapters** — Frost Ruins (Levels 1–10), Stormspire Keep (11–20), and Aurora Citadel (21–30). Aurora Citadel includes four walk-in halls, Aurora Wisps, Prism Stalkers, the Boreal Sovereign with a telegraphed two-phase pulse, level-20 + Stormspire-clear gating, optional 17 × 67-block terrain construction, minimap guidance, persistent clears, Aurora Crystal drops and a real craftable Aurora Blade. Overworld high-level enemy tiers are added with level 30 caps. Build jobs proceed in small batches for mobile performance, with save migration preserving all earlier progress. Chapter 1 and 2, Castle Defense Tier I–III, Ward protection and recovery HUD remain implemented. Levels 31–100, future snowy regions and higher castle tiers remain planned; GitHub Pages and Android WebGL gameplay checks are still needed.
- Implemented 2-point walls and floors/roofs with safe empty-cell checks, 96-block limit and one-action undo.
- Implemented adjustable two-corner blueprint selection, JSON v1 export, color-coded 3D hologram preview, 90-degree rotation, terrain-height snapping, safe placement checks and batched installation.
- Creator Studio gallery: free starter blueprints, isometric thumbnails, native sharing, backups, import/deletion and SHA-256 fingerprints. Testnet source now has seven passing Move scenarios, buyer preview and clearer confirmation flows. The package still needs publication and wallet end-to-end tests.
- Next: full two-high doors, rotation and expanded furniture, snapping blueprints to terrain and collision-tested device QA.
- Expand NPC conversations, quests, world progression and creator building tools.
- Validate high/medium/low Android configurations.

- Castle Defense (source-implemented November 18): upgradeable Winter Wards Tier I–III, automatic hostile targeting with line-of-sight checks, opt-in three-wave monster raids focused on Ward shield integrity, in-raid repair, victory/defeat records, repeatable rewards, and save migration. Raids do not mine or destroy player-built structures, and active battles are intentionally transient. See docs/CASTLE_DEFENSE.md. Real-world Android performance and deployment checks remain pending.

## Phase 3: Sui Testnet creator market

**Implemented in source:** Move package for BuildNFT with stored voxel geometry, SHA2-256, shared escrow and exact-price Testnet sale; new Sui dApp Kit core wallet integration and Testnet UI; code for mint/list/cancel/buy, marketplace event discovery, integrity checks and fresh ownership verification before installation. Source tests and frontend SDK bundle run in GitHub Actions.

**Not completed:** Sui CLI compilation/tests, formal review, actual Testnet publication/package ID, wallet/browser end-to-end testing, production indexer, backend-authoritative entitlement, royalties, mainnet launch or real payments. Read docs/SUI_TESTNET.md. Use Testnet only; no mainnet fees.

Design choice: unlimited placement while holding the blueprint NFT, subject to an explicit creator license. NFTs do not automatically convey copyrights or prevent copying. No sale or income is guaranteed.

## Phase 4: production launch

- Optional marketplace fees (example proposed 5%, not implemented).
- Legal and brand/IP review, age/payment requirements and creator moderation.
- Audit contracts and backend authorization, abuse prevention, backups and reporting.
- Multiplayer or cloud save only if properly supported by a secure service.
