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

- Procedural snowy terrain, caves, weather, time of day and basic survival/creative modes.
- Mining, block placement, crafting, inventory, tool hotbar, local world save, touch joystick and swipe camera from the upstream engine.
- Custom Yeti model; change fur and scarf colors and show/hide a winter hat. The model uses unlit materials so its colors remain visible in third-person.
- Optional first/third-person camera; default first person for accurate building.
- Lofi starter shack with a simple four-stage quest.
- Prominent **🧱 BUILD** menu with labeled material tiles, quick starter set, and a persistent hint for the PLACE control. Creative free-building is the default for new worlds. Existing Survival saves can switch to Creative by choosing a material from BUILD.
- Save a nearby 11×12×11 building area as a JSON blueprint, then import and place it in your world. No wallet needed.

## Controls

Phone: **tap 🧱 BUILD in the top-left first**, select a material, aim the crosshair at the ground or wall, tap the cyan **□ PLACE** button on the right. Hold **⚒ MINE** to remove blocks. Left thumb joystick moves; swipe the right half to look. Existing Survival saves automatically offer the building menu once. The FlurryCraft buttons near the upper left offer 👁 View, 🎨 Yeti, 🏠 Blueprint, 📂 Import. Use landscape orientation.

Desktop: WASD move, mouse look, left click mine, right click place, Space jump, E inventory, 1–9 hotbar, **G open BUILD menu**, V switch camera, B save blueprint.

Use shorter render distance from the menu if mobile performance is poor.

## Important status

The code has undergone static JavaScript syntax validation, but has not yet been tested end-to-end in a real phone browser. Browser data is stored locally on the user's device. Uploading/minting Sui NFTs, paid marketplace listings, real earnings, royalties, multiplayer and actual cloud storage are planned, NOT implemented. See docs/ROADMAP.md.

## Development

No npm install is needed to play the game. Developers can run the optional syntax smoke tests with Node 20+ using npm test.

## Licensing

This repository's MIT license covers FlurryCraft-specific work. Source code derived from GoldwinXS's MIT Yet Another VoxelCraft keeps the author's license in UPSTREAM_LICENSE.txt. Bundled Three.js is also MIT licensed. Confirm appropriate rights to Lofi or other third-party character artwork before commercial distribution.
