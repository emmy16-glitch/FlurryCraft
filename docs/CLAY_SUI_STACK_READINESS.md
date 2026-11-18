# FlurryCraft — CLAY Hackathon III × Lofi × Sui Stack readiness

**18 November 2026.** This is a development checklist, not a claim of a submitted entry or live NFT trading.

## Official organizer and track

Organizer: **Lofi the Yeti / Lofi Foundation** — the CLAY (*Code Like A Yeti*) Hackathon at https://hackathon.lofitheyeti.com/.

The organizer's published 2026 mini-game track asks for a **mini-game featuring Lofi**. The organizer describes the relevant Sui Stack as **Sui Network, Walrus storage and DeepBook liquidity**, among other components. That list is an ecosystem overview, not a demand to embed an exchange in a winter survival game. DeepBook swaps or speculative token markets are intentionally NOT included.

The organizer's public checklist at the URL above asks for:
- Project name and concise description
- 1:1 project logo (JPG/PNG)
- Public GitHub repository
- Demo video of **3–5 minutes maximum** (YouTube preferred)
- Optional website and supplementary documentation
- Optional onchain package ID if a contract has been deployed and verified

The organizer announced round III beginning **16 November 2026** and running through the end of December. Verify the current deadline on the official organizer page before submitting.

## What FlurryCraft has built

| Component | Source status | Independent Testnet / device status |
|---|---|---|
| Lofi/Yeti-themed snow game and 4 dungeon chapters | Implemented | Real-phone QA pending |
| Mobile mining, castle building, combat, saves, 3D weapons | Implemented | Real-phone QA pending |
| World-save validation and small rolling backups | Implemented and tested | Real-browser quota checks pending |
| Sui Move NFT blueprint + escrow marketplace | Source + scenario tests | **No deployed package ID; NOT live** |
| Sui optional wallet inspector | Code: read-only Testnet connection | Android wallet/browser QA pending |
| Walrus Testnet public blueprint storage | HTTP Testnet publisher + aggregator, canonical geometry and SHA-256 receipt | Public service/CORS + live roundtrip QA pending |
| DeepBook exchange | Not part of FlurryCraft | Not applicable; no token speculation |
| Demo video, final logo, submission | Not completed by these commits | User/organizer submission required |

### Walrus Testnet workflow

1. Play a world and go to **My Builds**.
2. Under a saved or starter house card choose **More options → Walrus Testnet Share**.
3. Read the public-storage warning and *explicitly confirm*. Only the selected blueprint's safe, canonical voxel geometry (at most 24 KB) is uploaded to Walrus Testnet using the official public publisher.
4. If the upload succeeds, save **Download Verification Receipt**. This contains a blob ID, SHA-256 fingerprint, name and author (not wallet secrets).
5. The same public design can be retrieved in **My Builds → Storage & Backup → Import Walrus Blueprint**, by pasting the 43-character blob ID and optionally the expected SHA-256 fingerprint.
6. The imported blueprint must pass canonical block/dimension validation before becoming a local design.

Walrus is public and has storage epoch/availability limits. This is not a private backup, an NFT, ownership proof or guarantee of permanent retention. Public Testnet endpoints have rate and uptime limits. No upload happens without a user action. Existing local worlds and builds are never uploaded automatically.

## Remaining Sui launch steps

1. Validate the Move source with a current Testnet Sui CLI: `sui move test` and `sui move build`.
2. Conduct a security review of the NFT escrow contract (no audit claim has been made).
3. With an **authorized Sui Testnet wallet**, publish the package, retain the UpgradeCap, and run `sui client verify-source` to verify onchain bytecode matches source.
4. Place the verified 0x + 64-hex **Testnet** Package ID in `js/sui-config.js`. Do not enter private keys or mnemonic words into the repository.
5. Run `npm install`, `npm test`, `npm run check:sui`, `npm run test:chain` and `npm run build:chain`.
6. Test mint → list → buy → verify ownership → preview → place using **two separate Testnet wallets** (including Android wallet browsers), inspect transactions and gas, test listing cancellation.
7. Verify the deployed GitHub Pages build has the latest `dist/sui-bridge.js` bundle and that the wallet controls do not interrupt free offline/single-player gameplay.
8. Record a concise 3–5 minute video showing gameplay **and an actual onchain demo** if deployed. Never claim an unpublished NFT contract works.
9. Submit via the organizer's official form once the public GitHub, demo video, logo and description are ready.

**Safety:** NFTs store publicly copyable building voxel geometry. Tokens do not grant copyright or prevent a user from copying a public design outside the marketplace. A browser-only ownership check is not server-side authorization. Wallet signature prompts always require player approval.

## Verification logs and caveats

- The new Walrus data-path tests simulate uploader responses, verified blob download, content hashes and malicious input. They passed in a JavaScript harness. No real external upload was made in this implementation session.
- Save recovery tests cover corrupt JSON, partial inventory, block-index validation, quota errors and backup throttling. They passed in a JavaScript harness.
- Sui wallet/market changes are syntactically checked; Testnet RPC, Android wallets, Move compilation/publish, signing and explorer confirmations still need real-world validation.
- The GitHub Actions job `Sui Testnet Readiness (read-only)` builds the wallet module and checks ABI/BCS in CI without any wallet secret or transaction. It prints 'UNPUBLISHED' if the Package ID is intentionally empty.
