# Winter Landmarks — discover, inspect and recover

This update adds **real 3D places** to FlurryCraft's snowy overworld.
Each location is placed deterministically using the **world seed and
actual procedural terrain height**, so returning to it in the same
world shows the same place. The structures are visual-only additions,
not voxel edits: they cannot silently replace a player's buildings,
dungeons, inventory or world backup.

## Three encounters

| Landmark | In-world model | One-time Survival benefit |
|---|---|---|
| **Wayfarer Refuge** | Wooden trail shelter, snow-covered roof, warm campfire | Rest and regain up to **6 health** when injured |
| **Aurora Waystone** | Four glacial pylons surrounding a luminous icy crystal | Refill your **sword guard stamina** |
| **Frost Cairn** | Stacked frost-stones with a glowing icy tip | Collect **one Frost Shard**, if inventory space allows |

To interact, approach within **6 blocks**, including at a reasonable
height. Press **F** on desktop or tap the on-screen **Explore** button
on mobile. Your character reads a short winter-world story, and the
location is recorded in the Explorer's Field Journal. The optional
benefit is claimed by a separate button so walking by cannot
automatically spend it.

Benefits are single-use **at each site, per world**. They are not
available in Creative Mode, to dead players, or while an item is
already used. If you are already at full health or guard stamina,
you may return later. Frost Shards require real inventory space.
Nothing here creates local Flurry Points, Adventure XP, SUI, fiat,
withdrawable crypto, Testnet NFTs, or any wallet transaction.

## Location and mobile performance

The world contains a possible **starter refuge** around the initial
spawn and additional seeded cairns, refuges and waystones spaced
roughly on 128-block terrain cells. Sites are rejected on ocean,
cliffs or otherwise unsuitable ground, rather than floating above
the map. Not every cell has a landmark.

Only sites within about **115 blocks** are considered for rendering.
At most **six 3D groups** are active at any time; each is a handful
of shared-geometry, low-poly meshes using basic materials. Groups
are removed when the player travels away or switches worlds.
Landmark positions are recalculated at most every **2.5 seconds**,
and nearby interaction checks are throttled to about five per second.
There is no new server, networking, world generation pass or shadow
render target.

## Map and Explorer Journal

- The **minimap** shows nearby real 3D sites as light-cyan squares.
- The **World Map** lists nearby Winter Landmarks with **Guide**
  and **Pin** actions. Previously explored landmarks remain under
  **Winter Landmarks · Visited** after they move out of range.
- The **Explorer's Field Journal** includes **Winter Landmarks
  Explored** with visited coordinates and navigation.
- Guide is navigation only; players still need to reach each site.

## Save safety and fairness

Each world keeps an optional compact `winterLandmarks` ledger with
up to 24 unique visited sites and once-per-site `used` records.
This field is serialized in the existing world save and portable
backup. Legacy saves with no field load as empty and keep all
world edits, inventory, quests, XP, points and maps unchanged.
The saved ledger is validated and bounded on load.

No claim is made that browser-side game state prevents tampering.
A trusted, server-backed reward system would be required before
these discoveries could prove eligibility for external incentives.

## Manual checks

1. Create a Survival world. Find a nearby wooden refuge or explore
   until a waystone/cairn appears.
2. Look at the real 3D object, not just a map icon.
3. Approach within 6 blocks and use **F** or **Explore** touch button.
4. Verify its story, journal entry and separate one-time benefit.
5. Inspect again: the claimed benefit must show as used.
6. Return injured to an unused refuge to recover health.
7. Navigate to the site from the map or Field Journal.
8. Save and Continue the world; visited and used status must remain.
9. Switch worlds; the old world's landmarks must not leak.
10. Confirm Creative mode can inspect but cannot claim benefits.
11. Verify no duplicate points, XP, tokens or NFT transactions.

CI includes deterministic layout rules, pure save/claim safety,
real 3D mesh lifecycle, and Chromium desktop/touch landscape
gameplay verification. Physical phone testing remains recommended.
