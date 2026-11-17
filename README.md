# ❄️ FlurryCraft — Build Your World of Winter

Browser-first, free-to-play voxel sandbox for Android, iPhone and desktop. FlurryCraft is evolving toward a creator economy on Sui, but blockchain sales are NOT enabled yet.

Built on the MIT-licensed [Yet Another VoxelCraft](https://github.com/GoldwinXS/YetAnotherVoxelCraft) engine by GoldwinXS, with a local bundled Three.js r160. Original attribution is preserved in UPSTREAM_LICENSE.txt.

## Play in a browser

To publish your own website:
1. Open this GitHub repository, then Settings → Pages.
2. Select GitHub Actions as the Build and deployment source.
3. Open Actions → Deploy FlurryCraft to Pages → Run workflow, if an automatic deployment did not start.
4. After a successful deployment, use https://emmy16-glitch.github.io/FlurryCraft/

The address above is a proposed URL and works ONLY after Pages has been configured and deployed. There is no app to download. You may also run a local static web server such as Python http.server on port 8000. Direct file:// opening is not supported because the game uses JavaScript modules.

## Current features (pre-alpha)

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
- **Sui Testnet integration (SOURCE ONLY):** experimental Move NFT/escrow market contract, official Sui Wallet Standard bridge, marketplace UI, onchain blueprint content/digest verification and a fresh ownership check before installing an owned NFT. View the Testnet UI under **More → ⛓ Sui Testnet** or a Studio card's **⛓ NFT Testnet**. The contract is **NOT deployed** and signing/trading stay disabled until a verified Testnet package ID is provided. See [Sui Testnet setup](docs/SUI_TESTNET.md).
- **Creator blueprints:** choose two opposite corners of your building (up to 32 blocks per side / 6,000 occupied blocks), name it and export a version-1 JSON file. Import old or new JSON blueprints. A transparent, color-coded 3D hologram lets you rotate 90° or nudge in all directions before placing. Empty-space and player-collision checks prevent accidental overwrites. **⬇ Ground** automatically lifts the placement preview above the terrain to make installing starter houses easier. Large placements are batched across frames. Offline blueprint placement remains free. An experimental Testnet NFT integration exists in source, but it is not yet published or live.

## Creator Studio: build and share

1. Open a world and tap **🏠 Studio** at the top of the screen.
2. Choose one of the two free starter buildings or save your own using **More → Save Build**.
3. Tap **▶ Preview** to see the actual blocks in your world; use **↺ Rotate**, **⬇ Ground** and the arrow controls to position it, then **✓ Place**.
4. Open **More options** on a building to download, share or view its fingerprint. Sharing sends a JSON building file, **not an NFT**.
5. The recipient opens **📂 Import JSON** in Studio, chooses the file and can place the same building. Use **⬇ Back Up All** to export a local gallery backup of up to 30 designs. Backups can be re-imported in Studio.

All saved creations currently live in browser storage. A hash proves only that two normalized blueprint files have identical geometry. It does not establish copyright, authorship, ownership, exclusivity, or resale value.

## Sui Testnet (not live yet)

The codebase includes a Move 2024 contract and a wallet-aware browser UI for experimental Testnet minting, listing, buying, cancellation and verifying ownership. **No contract package ID has been published or configured**, and no onchain sale has happened. The official Sui SDK bundle builds in GitHub Actions, but the Move contract still requires a real Sui CLI build, review and Testnet deployment. See [docs/SUI_TESTNET.md](docs/SUI_TESTNET.md).

Blueprint geometry would be stored publicly inside the onchain NFT, so a buyer could retrieve the actual building. Anyone can still copy public voxel data; the token is not copyright or an exclusivity guarantee. Never enter wallet recovery phrases into the game.

## Finding places in your world

Open **Menu → World Map** in a saved world. The map opens centered on your character and shows surrounding generated winter terrain, Spawn, Home (if set), and your own pins. Use **+ / −** to zoom, tap the terrain to select a position, and save it as a named place. **Set Home Here** saves your current position. Tap **Guide** beside a place to close the map and see a small arrow and straight-line distance. Tap **✕** on that arrow to stop navigation. There is no teleportation, GPS tracking or route planning.

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
