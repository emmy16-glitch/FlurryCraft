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

- Persistent winter landscape with snow-covered beaches, mountains and frozen seas, plus continual falling snow and periodic blizzards. New worlds start in daylight; Creative defaults to a bright world with a toggle in More. Survival retains a day/night cycle.
- Mining, block placement, crafting, inventory, tool hotbar, local world save, touch joystick and swipe camera from the upstream engine.
- Redesigned, expressive low-poly Yeti with a blue face, visible eyes, smile, blue paws and snowy fur; customize fur, face and scarf colors and wear a winter hat. Original illustrated SVG artwork appears in the title screen, loading screen, quests and character editor. The model uses unlit materials so its colors remain visible in third-person.
- Optional first/third-person camera; default first person for accurate building.
- Lofi starter shack with a simple four-stage quest.
- Illustrated winter-Yeti visual identity and simplified opening menu: create or resume a world, customize your Yeti, and open optional settings. In-game controls prioritize **BUILD**, camera and More.
- **More → ↗ Unstuck** returns you above your spawn in safe flight mode if you get trapped underground; **More → 🪽 Fly** toggles flight; **More → ☀ Day** controls bright Creative daylight. Placement hints are limited to avoid covering gameplay.
- **Smart Build (More → Walls / Floors):** Choose a normal block from + ALL, then mark two aimed corners to build a straight wall or flat floor/roof in one action (up to 96 new blocks). Won't overwrite existing blocks; includes More → Undo Build for the last operation. Available in Creative and in Survival when using unlimited blocks from the block library.
- **House pack:** one-block door that opens/closes when tapped, framed glass window pane, table, chair, bed, and glowing fireplace. Find these in + ALL; they are saved as real blocks and included in exported blueprints. Current doors are one block high; furniture geometry is low-poly and collisions approximated.
- **Direct bottom hotbar controls:** tap any filled slot to equip it; tap an empty slot to add a block; hold a filled slot to replace its material; use **+ ALL** next to the hotbar for a searchable, categorized list of every supported block item in the engine (including stairs and slabs). These work in Creative and Survival without changing modes. Library blocks are unlimited in either mode; naturally acquired Survival inventory items are kept when possible. No new furniture blocks have been invented yet.
- Prominent **🧱 BUILD** menu with the same searchable material collection, starter set, and brief placement hint. Picking a building material automatically returns to first-person aiming. Creative free-building is the default for new worlds. Existing Survival saves can switch to Creative by choosing a material from BUILD.
- **Creator blueprints:** choose two opposite corners of your building (up to 32 blocks per side / 6,000 occupied blocks), name it and export a version-1 JSON file. Import old or new JSON blueprints. A transparent, color-coded 3D hologram lets you rotate 90° or nudge in all directions before placing. Empty-space and player-collision checks prevent accidental overwrites. Large placements are batched across frames. All this is local only—there is no NFT minting or real-money sale.

## Controls

Phone: **More → Save Build** to mark both corners and download your house. **More → Import** to choose a blueprint, then use hologram buttons (Rotate, Left, Right, Forward, Back, Up, Down, Place or Cancel). Phone: use **More → Walls / Floors** for two-point construction after selecting a material, tap the MARK 1 and MARK 2 + BUILD buttons at the top while aiming at surfaces. **More → Undo Build** reverses your last smart operation. Tap a block in the bottom hotbar to equip it. Tap **+ ALL** to browse or search every currently supported building block, including slabs/stairs; choose one and it replaces your selected hotbar slot. Tap an empty slot to fill it or long-press a filled slot to change its contents. Works in Creative or Survival. Aim the crosshair at the ground or wall, tap the cyan **□ PLACE** button to place; hold **⚒ MINE** to remove. Left thumb joystick moves; swipe the right half to look. The FlurryCraft buttons near the upper left offer 👁 View, 🎨 Yeti, 🏠 Blueprint, 📂 Import. Use landscape orientation.

Desktop: WASD move, mouse look, left click mine, right click place, Space jump, E inventory, 1–9 hotbar, **G open BUILD menu**, V switch camera, B save blueprint.

Use shorter render distance from the menu if mobile performance is poor.

## Important status

The code has undergone static JavaScript syntax validation, but has not yet been tested end-to-end in a real phone browser. Browser data is stored locally on the user's device. Uploading/minting Sui NFTs, paid marketplace listings, real earnings, royalties, multiplayer and actual cloud storage are planned, NOT implemented. See docs/ROADMAP.md.

## Development

No npm install is needed to play the game. Developers can run the optional syntax smoke tests with Node 20+ using npm test.

## Licensing

This repository's MIT license covers FlurryCraft-specific work. Source code derived from GoldwinXS's MIT Yet Another VoxelCraft keeps the author's license in UPSTREAM_LICENSE.txt. Bundled Three.js is also MIT licensed. Confirm appropriate rights to Lofi or other third-party character artwork before commercial distribution.
