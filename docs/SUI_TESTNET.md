# FlurryCraft — Sui Testnet implementation

**Status: Frontend and Move contract source implemented; no published package ID yet.**

## Implemented

- Move source: move/flurrycraft/sources/market.move — Blueprint NFT containing real voxel geometry, onchain SHA2-256, mint, shared escrow listing, seller cancellation and atomic exact-price Testnet SUI purchase.
- Browser: js/sui-bridge.js — official @mysten/sui v2 and @mysten/dapp-kit-core wallet-standard integration, dynamically bundled for GitHub Pages.
- UI: More → ⛓ Sui Testnet or Studio → ⛓ NFT Testnet. Wallet connection, owned NFTs, recent listings, mint/list/buy/cancel actions, and installation that rechecks owned token data.
- JS safety: invalid block rejection, max 24KB canonical geometry payload, deterministic hash, integer MIST price conversion, onchain escrow integrity checks, and mandatory wallet approval for transactions.

The regular FlurryCraft browser game remains free and playable without a wallet.

## Before real Testnet transactions are possible

The Move contract has **NOT** been compiled with a Sui CLI, audited or published. SUI_PACKAGE_ID is intentionally empty. No NFT has been minted or sold by this implementation. Do NOT claim the Testnet feature is operational until verified.

Follow the official Sui docs:
https://docs.sui.io/develop/publish-upgrade-packages
https://docs.sui.io/develop/write-move

A developer using their own authorized Testnet wallet should:

1. Install the latest official Sui CLI and check the wallet environment with: sui client active-env
2. Switch to Testnet: sui client switch --env testnet
3. Enter directory: cd move/flurrycraft
4. Test Move: sui move test
5. Build Move: sui move build
6. Estimate gas: sui client publish --dry-run
7. Investigate and fix compiler errors, security issues and test failures. Only publish after the checks and review are satisfactory.
8. Publish Testnet: sui client publish
9. Verify the published bytecode: sui client verify-source
10. Keep the UpgradeCap private. Record the published package ID and transaction digest.
11. Set js/sui-config.js SUI_PACKAGE_ID to the exact verified 0x + 64-hex-character Testnet package ID. Commit it. GitHub Pages rebuilds the optional browser bundle.
12. Test mint/list/buy/cancel with TWO separate Testnet wallets, free Testnet SUI and small building geometry, and then retest Android wallet browsers.

Do not paste recovery phrases, seed phrases, private keys or other sensitive wallet material into this project.

## Expected workflow once published

1. Open the game in a compatible wallet browser. Go into a snowy world.
2. In Studio, choose a local blueprint and tap NFT Testnet.
3. Connect wallet and approve mint. The complete blueprint bytes become PUBLIC on Sui Testnet.
4. Refresh My Testnet Buildings and verify token ownership.
5. List at a Testnet SUI price. An escrow object holds the token until it is sold or cancelled.
6. The second wallet buys. Exact price and NFT content are verified before signing.
7. Buyer refreshes My Testnet Buildings and previews/install the build. The game rechecks current chain ownership immediately before placement.

## Safety and truthfulness

- Testnet coins have no intended real-world monetary value. There are no platform commissions, fiat payments, real income claims or Mainnet features.
- An NFT proves ownership of an onchain token, NOT copyright, legal exclusivity or originality. Public voxel data can be copied even without buying the token; browser-side entitlement checks can be bypassed by a modified client.
- Onchain geometry is permanent/public. Do not mint private designs.
- Contract enforces byte-length and hashes but does not parse the FlurryCraft voxel format itself; an external minter could create a malformed token. Frontend verifies format, hash and safe block IDs.
- Ownership checks are refreshed before installing, but edits already placed in local worlds remain even if a token is later sold.
- Event-based marketplace discovery only covers recent event history; a complete live product needs an indexer. It is not production-ready.
- Local browser world files and blueprints are not synchronized to cloud. Back them up.
- Move code, contracts and Android wallet interactions are not yet end-to-end or independently audited. Sui CLI was not available in the assistant's runtime.
