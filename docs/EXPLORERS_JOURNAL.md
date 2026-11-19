# Explorer’s Field Journal — world-specific discoveries

The Field Journal turns the existing snowy world and minimap into a real
exploration activity, without adding more permanent mobile HUD controls.

## Where to find it
Open **Menu → World → 📖 Explorer Journal**, or talk to Lofi and choose
**Explorer Journal**. The journal has three sections and a **Guide** action
beside every recorded destination.

### Landscapes (four)
The journal identifies *actual procedural terrain from the world's
generator* when the player is physically standing on the surface:

- **Snowy Tundra** — winter plains
- **Snowy Peaks** — high glacial ridges
- **Frozen Sea** — walking on an icy sea
- **Ice Shore** — the boundary between snow and frozen water

A particular landscape type is recorded only once per world. The saved
entry contains the genuine coordinates where it was first encountered.

### Trail markers (ten)
As the player walks away from previously surveyed points, up to ten
spaced **Trail Markers** are recorded. Each new site must be at least
160 blocks from every existing trail marker and has a world-based grid
identity to avoid near-duplicate pins. Movement through air, flight,
death or underground passages does not count as a surface survey.

### Dungeon visits (four)
The world map can already show real **known** dungeon locations. The
Journal separately records an actual visit when the player stands within
20 blocks of a **built** entrance. A discovered-but-unbuilt Stormspire
Keep or another chapter location is **not** counted as visited.

On desktop, press **M** to open the full World Map even when the mouse is
captured by the game; on phones, tap the minimap.
\nThe map only lists discovered locations from this same save. The minimap
adds small markers for visited places, and the World Map has a separate
**Field Journal · Visited Places** group with Guide actions.

## Mobile experience
Discovery sampling runs at most once per 1.4 seconds of visible, active
gameplay, so it does not scan every frame. All entries are bounded to
18 records: four landscapes, four dungeon visits and ten trail markers.
The on-screen discovery announcement is brief, noninteractive and
supports reduced-motion accessibility settings.

## Saves and integrity
The journal is saved as a compact optional `journal` field inside
the normal FlurryCraft world save and portable backup. Older saves simply
have an empty journal; existing buildings, XP, missions, inventory,
world-map pins and downloaded backups are unaffected. Loading a
different world resets the discovery ledger for that world.

The journal never creates or claims Flurry Points, XP, SUI, fiat or
crypto, and never mints NFTs. It cannot prove remote/signed
achievements—browser saves are locally editable. There are no wallet
calls or external requests.

## Manual QA
- Start a Survival world and open the journal. The starting surface
  will be recorded after the player has actually landed.
- Walk around to discover additional snowy terrain. One biome type
  should never create multiple cards.
- Walk at least 160 blocks from previous trail points to place more
  surveyed markers, up to ten.
- Travel to a built dungeon entrance; verify a *visited* record appears,
  not merely a known map marker.
- Open the world map and guide to a journal-discovered location.
- Quit and Continue the world. Discoveries must remain.
- Load an older world without journal data. It must load normally.
- Switch between two saved worlds. Their journal entries must not mix.
- Fly in Creative, die, pause or open menus; no passive discoveries occur
  while not actively on the surface.
- Confirm no local points, XP, or Sui transactions are issued by scanning.

CI runs pure journal rules, saves and Chromium desktop/mobile-landscape
checks. A physical Android device remains the recommended usability
and performance verification.
