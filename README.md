# ❄️ FlurryCraft — Build Your World of Winter

Browser-first, free-to-play voxel sandbox for Android, iPhone and desktop. FlurryCraft is evolving toward a creator economy on Sui, but blockchain sales are NOT enabled yet.

Built on the MIT-licensed [Yet Another VoxelCraft](https://github.com/GoldwinXS/YetAnotherVoxelCraft) engine by GoldwinXS, with a local bundled Three.js r160. Original attribution is preserved in UPSTREAM_LICENSE.txt.

## 🎮 Playability and graphics polish

FlurryCraft now offers **Auto · Adaptive**, **Sharp · Quality**, and
**Smooth · Performance** graphics settings in both the start menu and
Pause → Settings. Auto gradually adjusts the real WebGL internal render
resolution and, after sustained severe slowdown, can temporarily reduce
the furthest view-distance rings without changing world saves. The game
also budgets large building placement and urgent chunk remeshing by
milliseconds, uses fewer snowflakes in Smooth mode, pauses rendering when
the browser tab is hidden, and preserves a bright snowy welcome scene.

Desktop **WASD** and emulated mobile **touch joystick** movement, a
controlled Frostling targeting/melee test, graphics selectors, and
Rewards Hub navigation are exercised by the separate GitHub Actions
Chromium gameplay suite. Screenshots and webm proof are uploaded as
test artifacts. Headless software GPU testing is not a physical
Android or gaming-PC FPS benchmark.

[Graphics modes, controls, performance limits and QA evidence](docs/GAMEPLAY_PERFORMANCE.md).

## ❄️ CLAY Hackathon III — judge-first guided adventure

The welcome screen now includes **▶ Try Guided Adventure Demo**.
This opens a fresh **Survival** save and a dismissible six-step guide:
meet Lofi, fight snowy enemies, build, inspect Rewards Hub missions,
open Creator Studio/Walrus features, and inspect Sui Testnet safely.
The guide **does not grant fake levels, loot, crypto or NFT sales**.

Open **Menu → Adventure → ▶ Guided Tour** to restart the walkthrough
inside an existing world; click **X** to return to normal gameplay.
No wallet is needed to play. The guide works on mobile landscape and desktop.

For the official submission checklist, 3–5-minute video storyboard,
truthful pitch, and device verification checklist, see
[CLAY III Submission Pack](docs/CLAY_III_SUBMISSION.md).

## ✦ Flurry Rewards Hub (local points, no cryptocurrency payout)

In a playable Survival world, choose **Menu → ADVENTURE → ✦ Rewards Hub**.
The hub shows milestones for levels 10–100 and the four dungeon chapters,
plus daily/weekly monster, construction and dungeon missions. Completing
them awards **local, world-specific Flurry Points** after tapping Collect.
The mission ledger is included in world saves and downloadable world backups.

**Flurry Points are NOT SUI, not redeemable, and have no fiat value.**
No server-side anti-cheat verifier or funded crypto treasury is deployed.
Real cryptocurrency withdrawals are deliberately disabled; normal gameplay
does not need a wallet. A future funded claim system needs server-verified
achievements, rate limits, a secure treasury contract and a Mainnet rollout.
See [Rewards Hub architecture](docs/REWARDS_HUB.md).

The Sui developer contract-publishing controls are no longer shown to normal
players: they are available only when a developer explicitly adds
`?developer=1` to the game URL. This is a UI affordance, **not access control**,
and publishing still requires the signer's own Testnet wallet approval.

## Play in a browser

To publish your own website:
1. Open this GitHub repository, then Settings → Pages.
2. Select GitHub Actions as the Build and deployment source.
3. Open Actions → Deploy FlurryCraft to Pages → Run workflow, if an automatic deployment did not start.
4. After a successful deployment, use https://emmy16-glitch.github.io/FlurryCraft/

The address above is a proposed URL and works ONLY after Pages has been configured and deployed. There is no app to download. You may also run a local static web server such as Python http.server on port 8000. Direct file:// opening is not supported because the game uses JavaScript modules.

## Current features (pre-alpha)

- **Always-visible minimap:** a compact minimap sits near the upper-right of gameplay (below the mobile inventory/pause buttons and clear of Place/Mine). Tap to expand, tap any spot on the full map to begin guidance instantly, then tap outside or ✕ to shrink it back. Your current position, destination line, direction and remaining block distance stay visible in the mini. Save Home or named pins only when you want to. The minimap updates terrain incrementally as you travel to keep Android smooth, using a double-buffered low-resolution terrain view.
- **Explorer Map:** a private, offline terrain map under **Menu → World Map**. Set Home at your current location, tap the map to save up to eight named places per world, and select Guide for a minimal directional compass. Zoom and recenter without loading online map tiles or using device location. Custom buildings are not drawn on the terrain preview. Places are stored in the same browser (back up before clearing storage).
- **Winter World 2.0:** thick snow caps on terrain, frosted spruce leaves, softened near/far snowflakes, animated blizzard gusts and adaptive snow particle counts for Android. Snow is permanent, with Storm the default. Use **Menu → Weather** to switch between Storm, Snowfall and Calm. The terrain and saved world format remain unchanged. New worlds start in daylight; Creative defaults to a bright world, while Survival keeps its day/night cycle.
- Mining, block placement, crafting, inventory, tool hotbar, local world save, touch joystick and swipe camera from the upstream engine.
- Redesigned, expressive low-poly Yeti with a blue face, visible eyes, smile, blue paws and snowy fur; customize fur, face and scarf colors and wear a winter hat. Original illustrated SVG artwork appears in the title screen, loading screen, quests and character editor. The model uses unlit materials so its colors remain visible in third-person.
- Optional first/third-person camera; default first person for accurate building.
- Lofi starter shack with a simple four-stage quest.
- Calm winter UI: create or resume a world, optional character/settings controls, and three primary in-game actions: **Blocks**, **My Builds** and **Menu**. Building tools, camera, Yeti customization, flight, quests and Testnet preview are available inside Menu.
- **More → ↗ Unstuck** returns you above your spawn in safe flight mode if you get trapped underground; **More → 🪽 Fly** toggles flight; **More → ☀ Day** controls bright Creative daylight. Placement hints are limited to avoid covering gameplay.
- **Smooth building jobs:** walls, floors and blueprint houses are installed in small per-frame batches (10 blocks/frame on touch devices, 24 on desktops) with a tiny progress strip rather than freezing the phone. A whole job is one Undo step; Save & Exit waits until the current build finishes.
- **Precision build outline:** a subtle cyan outline previews the next block's position in first-person, without extra HUD buttons. Touch scrolling remains enabled inside inventory, the My Builds gallery, world settings and dropdowns.
- **Build History:** 40-step Undo/Redo for Creative placement/mining, door interactions, smart walls/floors and imported buildings. Actions are checked for conflicting edits and player collisions before restoring blocks. Open **Menu → Undo / Redo** or use Ctrl+Z / Ctrl+Y on a keyboard. History resets when you leave the world; it doesn't create extra cloud files. Save & Exit will not discard your world if a save fails, and going to another browser tab triggers an autosave attempt.
- **Smart Build (Menu → Walls & Floors):** Choose a normal block from + ALL, then mark two aimed corners to build a straight wall or flat floor/roof in one action (up to 96 new blocks). Won't overwrite existing blocks; includes More → Undo Build for the last operation. Available in Creative and in Survival when using unlimited blocks from the block library.
- **House pack:** matching two-high doors open/close together for a passable doorway, plus framed window panes, table, chair, bed and glowing fireplace. Find these in + ALL; the low-poly furnishings save with houses and blueprints.
- **Direct bottom hotbar controls:** tap any filled slot to equip it; tap an empty slot to add a block; hold a filled slot to replace its material; use **+ ALL** next to the hotbar for a searchable, categorized list of every supported block item in the engine (including stairs and slabs). These work in Creative and Survival without changing modes. Library blocks are unlimited in either mode; naturally acquired Survival inventory items are kept when possible. House Pack 1 furniture is available.
- **Blocks** opens the searchable material collection and starter set. On-screen help stays hidden until the player enters a two-point building or capture operation. Picking a building material automatically returns to first-person aiming. Creative free-building is the default for new worlds. Existing Survival saves can switch to Creative by choosing a material from BUILD.
- **My Builds:** separate tabs for saved creations and free starter homes. Preview & Place is the primary action; file sharing, downloads, fingerprints and Testnet options are under each card's More options. Storage backups are under Storage & Backup.
- **Sui Testnet integration (SOURCE ONLY):** NFT escrow contract with seven passing Move scenario tests and pinned Sui CLI validation, official Wallet Standard browser connection, plus a clean three-tab marketplace: Explore, My NFTs, Create. The storefront previews the actual blueprint before purchase and reviews each price before signing. SHA-256 and fresh owner checks protect NFT installation. View the Testnet UI under **More → ⛓ Sui Testnet** or a Studio card's **⛓ NFT Testnet**. The contract is **NOT deployed** and signing/trading stay disabled until a verified Testnet package ID is provided. See [Sui Testnet setup](docs/SUI_TESTNET.md).
- **Creator blueprints:** choose two opposite corners of your building (up to 32 blocks per side / 6,000 occupied blocks), name it and export a version-1 JSON file. Import old or new JSON blueprints. A transparent, color-coded 3D hologram lets you rotate 90° or nudge in all directions before placing. Empty-space and player-collision checks prevent accidental overwrites. **⬇ Ground** automatically lifts the placement preview above the terrain to make installing starter houses easier. Large placements are batched across frames. Offline blueprint placement remains free. An experimental Testnet NFT integration exists in source, but it is not yet published or live.

## Creator Studio: build and share

1. Open a world and tap **🏠 Studio** at the top of the screen.
2. Choose one of the two free starter buildings or save your own using **More → Save Build**.
3. Tap **▶ Preview** to see the actual blocks in your world; use **↺ Rotate**, **⬇ Ground** and the arrow controls to position it, then **✓ Place**.
4. Open **More options** on a building to download, share or view its fingerprint. Sharing sends a JSON building file, **not an NFT**.
5. The recipient opens **📂 Import JSON** in Studio, chooses the file and can place the same building. Use **⬇ Back Up All** to export a local gallery backup of up to 30 designs. Backups can be re-imported in Studio.

All saved creations currently live in browser storage. A hash proves only that two normalized blueprint files have identical geometry. It does not establish copyright, authorship, ownership, exclusivity, or resale value.

## Reliability, Walrus storage and CLAY Hackathon tech

**November 18 stabilization:** worlds now get validated before loading, and small local world saves have best-effort rolling backups. If a primary world save is damaged, the game can recover a valid previous backup without deleting the damaged original. Existing buildings, progression and inventory stay local to your browser.

**Portable whole-world recovery:** On the world-select screen choose **Backup** to download a full save file, or press **Restore World Backup (.json)** to import one into a NEW world slot without replacing existing saves. While playing, use **Pause → Save & Download World Backup** to export the latest castle, items and progress. Backups are local JSON snapshots, not automatic cloud sync or NFTs. See [World Backup & Recovery](docs/WORLD_BACKUP_RECOVERY.md).

**Walrus Testnet public blueprint sharing:** Open **My Builds → More options → Walrus Testnet Share** on any building to opt in to public decentralized storage of its canonical voxel data (24 KB limit). The game returns a SHA-256 verification receipt and 43-character Walrus blob ID. In **My Builds → Storage & Backup**, either import the saved Walrus receipt file (best: verifies the SHA-256 and preserves name) or enter the 43-character blob ID to validate the public blueprint. This is **not** NFT minting, private cloud save or a guarantee of permanent storage; Walrus Testnet publisher/aggregator availability and Android CORS have not been tested live.

**SDK response reliability:** All Sui NFT reads now validate size-limited BCS data before decoding, including asynchronous SDK transport responses. An NFT transaction only counts as successful with a verified execution-status result; temporary indexing delays do not prompt duplicate payments. These guards have independent regression tests. Real two-wallet Testnet testing and package publication are still pending.\n\n**Sui wallet prelaunch:** Sui Marketplace now offers a **read-only Testnet wallet check** and connection while the package ID is unset. This cannot sign mint/list/buy/cancel transactions until the Move contract is independently published, verified and configured. The app uses Sui v2 transaction coin intents for wallet compatibility, and validates escrow, ABI and NFT sizes. A separate CI workflow builds and checks the Testnet wallet module without secrets.

**CLAY Hackathon:** FlurryCraft follows the Lofi the Yeti mini-game track; the organizer highlights the **Sui Stack** (including Sui and Walrus). Liquidity trading through DeepBook is not relevant to a snow-building game. See [Sui Stack and organizer checklist](docs/CLAY_SUI_STACK_READINESS.md).

## Sui Testnet (not live yet)

The codebase includes a Move 2024 contract and a wallet-aware browser UI for experimental Testnet minting, listing, buying, cancellation and verifying ownership. **No contract package ID has been published or configured**, and no onchain sale has happened. The official Sui SDK bundle builds in GitHub Actions, but the Move contract still requires a real Sui CLI build, review and Testnet deployment. See [docs/SUI_TESTNET.md](docs/SUI_TESTNET.md).

Blueprint geometry would be stored publicly inside the onchain NFT, so a buyer could retrieve the actual building. Anyone can still copy public voxel data; the token is not copyright or an exclusivity guarantee. Never enter wallet recovery phrases into the game.

## Sword combat, equipment and player levels

**November 18 weapon/level upgrade:** swords are **equipment, not building blocks**. Tap a filled hotbar slot on mobile to wield it. New Survival worlds begin with a Wooden Sword already equipped; existing worlds can get a one-time sword through **Menu → Winter Adventure → Get Starter Sword** if eligible. Later swords arrive in inventory as rewards or can be crafted, and you equip them by selecting their hotbar slot. A weapon is shown as a colored, low-poly **3D blade with a handle, crossguard, cutting edges and pointed tip** in first-person. The Yeti also displays the wielded sword while in third-person. Aurora Blade includes crystalline details. Sword swings follow the existing tap/hold **ATTACK** button; a sword cannot be placed as a block.

Player levels grant **+0.75 melee weapon damage every five levels**, capped at **+4.5 at Level 30**; non-sword/unarmed attacks receive half the bonus. Weapon damage is Wooden 4, Stone 5, Iron 6, Diamond 7 and Aurora Blade 9 before level power and critical hits. A Level 30 player using an Aurora Blade deals 13.5 normal damage. **Health now begins at 24 HP, rises by 2 HP every five levels, and caps at 50 HP at Level 65** (Level 10: 28, Level 20: 32, Level 30: 36). Extra HP is added when leveling and normal healing, HUD hearts, respawn and Frost Shard recovery respect the new cap. Legacy 20-HP saves are migrated without wiping injuries, using a saved healthCap field to prevent repeat healing on reload. Boss HP now grows only within its chapter tier, not continuously from Level 1 (a Level 30 Boreal Sovereign has 270 HP), so new gear and levels let players defeat earlier monsters more quickly while late bosses still demand real fighting. See [Health & combat balance](docs/HEALTH_COMBAT_BALANCE.md). Physical Android/WebGL gameplay and difficulty tuning remain pending.

## Castle Defense — Winter Ward sieges

**Castle Defense (source-implemented November 18):** Winter Wards now upgrade through **Tier I–III**, increasing shield radius and auto-attacking nearby hostile creatures (no free kill XP). Stand by a Ward and open **Menu → Winter Adventure → Castle Defense** to review your available upgrades, then start an **optional three-wave raid**. Monsters attack the Ward shield instead of dismantling the castle. Tap **Repair Ward** in the raid HUD (2 Frost Shards + 4 Froststone for 22 integrity) or fight enemies normally. Wins grant materials and XP; failed defenses keep your buildings and upgrades intact. Tier II requires Level 10; Tier III requires Level 15 plus a Stormspire clear. Old saved Wards become Tier I automatically, and victories/losses save per world. **No raids start automatically**; active waves do not resume after reloading. See [Castle Defense guide](docs/CASTLE_DEFENSE.md).

## Winter Adventure (three playable chapters)

**November 18 mobile gameplay update:** the Survival HUD now shows live health and food below LV, with an optional **HEAL** button. Every heal costs **2 Frost Shards**, restores **up to 6 HP**, and has a **12-second cooldown**. Recovery also appears in Menu → Winter Adventure. Frostlings and Snow Prowlers stop slightly farther from the first-person camera while keeping their attack range, and newly generated spruce branches leave more room to walk and fight underneath. Nighttime ambient visibility is slightly brighter, the red damage vignette is softer, the enemy nameplate is higher, and the mobile hotbar is more compact. Existing saves and player-built blocks are kept, but unedited procedural tree foliage can change when chunks regenerate. These improvements are source-implemented; real-device regression testing is still required.

Survival players can open **Menu → Winter Adventure** to view Levels 1–100 progression, with four source-implemented dungeon chapters covering Levels 1–40. Original cold-adapted monsters roam the snow: **Frostlings**, fast **Snow Prowlers**, and a rare **Glacier Guardian** after reaching Level 8. Defeat them to gain XP and collect Frost Shards/Froststone Bricks.

New Survival worlds get a **three-chamber Frost Ruins** with a real walk-in entrance and separate ice-themed rooms. Follow **Guide to Entrance** on the minimap, go to the north gate, and tap **Enter Frost Ruins** when the prompt appears. Defeat the Frostlings, walk into the next chamber to trigger the Snow Prowlers, then fight the Glacier Guardian in the final sanctuary. No teleport or separate combat mode is needed. Existing worlds can opt into building or upgrading the ruins from Winter Adventure. **Upgrading older ruins requires confirmation because it replaces terrain in a 13×41-block area; nearby buildings can be affected.** Clear all three rooms for building materials and your first **Winter Ward**. Place a Ward near your castle to protect the surrounding 10-block radius: hostile creatures stop chasing players sheltered inside, player damage is reduced, and explosions cannot destroy blocks within that radius. Craft an additional ward with **5 Frost Shards + 12 Froststone Bricks**.

**Combat fix:** New Survival worlds begin with a basic wooden sword; Android targeting has a small wall-aware aim tolerance, and even a quick tap registers a hit when a living creature is targeted. Existing worlds keep their inventory and can claim one free wooden sword in **Menu → Winter Adventure → Get Starter Sword**, if they haven't claimed one. **Combat controls:** On Android, aim at a living creature and the existing Mine button automatically becomes **Attack** (⚔). Aim back at terrain and it becomes **Mine** (⚒). Hold the same button to act; no separate combat button or mode switch. Desktop left-click already attacks a creature or mines terrain. Targeted creatures have a small name, level and HP bar above the crosshair, and level-ups briefly display a celebratory banner. Tap **LV** below the main actions to open the clean XP/progression panel (also at Menu → Winter Adventure). Full-screen in-game panels temporarily suspend combat and movement. 

**Chapter 2 — Stormspire Keep (Levels 11–20):** Reach **Level 10** and clear the **Frost Ruins at least once**. Open **Menu → Winter Adventure → Scout Stormspire Site** to mark a distant, dry location on the map. Then select **Build Stormspire · 15 × 51 blocks**, review the explicit terrain/build overwrite warning, and follow the minimap to the construction site so nearby chunks can load. Nothing is built just by scouting. Approach the northern arch and tap **Enter Stormspire**. Clear the **Hound Courtyard**, walk into the **Rime Guard Hall**, and defeat the **Blizzard Titan** at the **Eye of the Blizzard**. New enemies include **Storm Hounds** and **Rime Knights**. The Titan telegraphs a close-range storm pulse; retreat from its blast radius. First clear grants an **Iron Sword** (inventory permitting, otherwise dropped), 9 Frost Shards, 24 Froststone Bricks and 260 completion XP. Later clears give materials and XP without duplicating the sword. Both chapters' completion counts and Chapter 2's site/build state are stored per world.

**Important:** Stormspire is a new generated structure, but creating it edits a 15 × 51-block footprint and can replace existing player builds. Check the marked area and back up the world before confirming. Existing worlds never receive the new fortress automatically. Building may pause until chunks near the site are loaded. Creature XP for this chapter is tuned to avoid jumping through the entire level range after one clear.

**Chapter 4 — Frostbound Abyss (Levels 31–40):** Reach **Level 30** and clear Aurora Citadel at least once. In **Menu → Winter Adventure**, scout the remote Rift site, check the minimap, then deliberately choose **Build Frostbound Abyss · 19 × 75 blocks** (building **overwrites terrain and any builds in that footprint**). Walk to the northern gate for a four-room challenge featuring Rift Stalkers, Umbral Sentinels and the two-phase Abyss Keeper. First clear earns a real **11-damage 3D Abyss Blade**, Abyss Crystals, Frost Shards, Froststone and 520 XP. Subsequent clears grant repeatable materials/XP, not another free sword. Craft extra blades from an Aurora Blade + 2 Abyss Crystals + 1 Frost Shard. These source changes have simulated test coverage; real Android/WebGL QA and GitHub Pages deployment still need verification. See [Chapter 4 guide](docs/CHAPTER4_FROSTBOUND_ABYSS.md).

**Chapter 3 — Aurora Citadel (Levels 21–30):** Reach **Level 20** and clear **Stormspire Keep at least once**. Open **Menu → Winter Adventure → Scout Aurora Citadel Site** to mark a distant, dry location (around 180+ blocks from spawn, away from previous dungeons) on the minimap. Scouting does not modify terrain. Explicitly confirm **Build Aurora Citadel · 17 × 67 blocks** only after checking/backup of the chosen area; the structure overwrites blocks in its footprint. Follow the map marker until construction completes and approach the north gate to enter. The four chambers introduce the floating **Aurora Wisp**, four-legged **Prism Stalker**, and the **Boreal Sovereign** boss, whose warned aurora pulse gains range and speed below half HP. The first complete run grants an **Aurora Blade**, **5 Aurora Crystals**, 12 Frost Shards, 28 Froststone Bricks, plus 370 completion XP. Repeat clears keep the materials/XP but do not duplicate the first-clear sword. The new blade is an actual sword (9 damage, durability 480) and can also be crafted from a Diamond Sword, two Aurora Crystals and one Frost Shard. The Citadel's site/build state and clears save per world without altering earlier chapters. See [Chapter 3 guide](docs/CHAPTER3_AURORA.md).

Progress, trial clears, Ward upgrades, Castle Defense victories and castle protection are stored per world. Only Survival earns XP; Creative remains a free building sandbox. Chapters 1–4 (through Level 40) and Castle Defense Tier I–III are implemented in source; content for Levels 31–100, future world regions, further siege types and multiplayer remains planned. Real phone/browser gameplay verification is still pending.

## Finding places in your world

Open **Menu → World Map** in a saved world. The map opens centered on your character and shows surrounding generated winter terrain, Spawn, Home (if set), and your own pins. Use **+ / −** to zoom, tap the terrain to select a position, and save it as a named place. **Set Home Here** saves your current position. Tap **Guide** beside a saved place or tap the expanded map itself to start guidance. Tap outside to shrink the map. The minimap keeps the player arrow, destination guide and straight-line distance visible. There is no teleportation, GPS tracking or route planning.

Each world has its own eight-pin limit, stored in your browser. Markers are independent of the NFT blueprint features and are not synced between devices.

## Controls

Phone: **🏠 Studio** is the main entry to starter houses, your designs, import, sharing and fingerprints. **More → Save Build** to mark both corners and download your house. **More → Import** to choose a blueprint, then use hologram buttons (Rotate, Left, Right, Forward, Back, Up, Down, Place or Cancel). Phone: use **More → Walls / Floors** for two-point construction after selecting a material, tap the MARK 1 and MARK 2 + BUILD buttons at the top while aiming at surfaces. **Menu → Undo / Redo** lets you reverse or repeat eligible edits. Tap a block in the bottom hotbar to equip it. Tap **+ ALL** to browse or search every currently supported building block, including slabs/stairs; choose one and it replaces your selected hotbar slot. Tap an empty slot to fill it or long-press a filled slot to change its contents. Works in Creative or Survival. Aim the crosshair at the ground or wall, tap the cyan **□ PLACE** button to place; hold **⚒ MINE** to remove. Left thumb joystick moves; swipe the right half to look. The FlurryCraft buttons near the upper left offer BUILD, 🏠 Studio, 👁 View and ⋯ More. Use landscape orientation.

Desktop: WASD move, mouse look, left click mine, right click place, Space jump, E inventory, 1–9 hotbar, **G open BUILD menu**, V switch camera, B save blueprint.

Use shorter render distance from the menu if mobile performance is poor.

## Important status

The code has undergone static JavaScript syntax validation, but has not yet been tested end-to-end in a real phone browser. Browser data is stored locally on the user's device. Wallet/Mint/List/Buy/Cancel code is present but NOT live: the contract has not been compiled or published and a Testnet package ID has not been configured. Real earnings, Mainnet payments, royalties, multiplayer and cloud storage are NOT implemented. See docs/ROADMAP.md.

## Development

No npm install is needed for users to play the deployed game. Developers can run Node 22+ tests with npm test. GitHub Actions installs the pinned Sui SDK dependencies and runs npm run build:chain to bundle the optional wallet bridge; it publishes only the browser assets, not node_modules.

## Licensing

This repository's MIT license covers FlurryCraft-specific work. Source code derived from GoldwinXS's MIT Yet Another VoxelCraft keeps the author's license in UPSTREAM_LICENSE.txt. Bundled Three.js is also MIT licensed. Confirm appropriate rights to Lofi or other third-party character artwork before commercial distribution.
