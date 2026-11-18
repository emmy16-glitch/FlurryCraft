# FlurryCraft — Sui Testnet implementation

**Status: Frontend and Move contract source implemented; no published package ID yet.**

## Implemented

- Move source: move/flurrycraft/sources/market.move — Blueprint NFT containing real voxel geometry, onchain SHA2-256, mint, shared escrow listing, seller cancellation and atomic exact-price Testnet SUI purchase. Seven Move scenario tests cover successful transfers and invalid actions. Pinned Testnet CLI tests run in .github/workflows/move-validation.yml.
- Browser: js/sui-bridge.js — official @mysten/sui v2 and @mysten/dapp-kit-core wallet-standard integration, dynamically bundled for GitHub Pages.
- UI: Menu → Sui Testnet or My Builds → More options → NFT Testnet. Three clean tabs for Explore, My NFTs and Create. Verified escrowed voxel geometry is previewable before buying; mint/list/buy/cancel use review screens and explicit wallet approval. Owned buildings are checked again before installation.
- JS safety: invalid block rejection, max 24KB canonical geometry payload, deterministic hash, integer MIST price conversion, onchain escrow integrity checks, and mandatory wallet approval for transactions. The configured package's Move ABI is checked on Testnet and the client waits for transaction indexing before ownership refresh.

## Stabilization and CLAY Sui Stack upgrade — 18 November 2026

- **Read-only wallet mode before launch:** In **Sui Marketplace**, choose **Check Testnet Wallet (read only)** to query the Sui Testnet and connect a compatible wallet. This can show an address and a Testnet SUI balance; with an empty Package ID, no mint, listing, purchase, cancel or signature action is available. A wallet is never needed for normal gameplay.
- **Up-to-date Sui v2 payment handling:** NFT purchases now use `Transaction.coin({balance: BigInt(...mist)})` so the SDK can source Testnet SUI from address balances or coin objects; exact price and live escrow status are checked again before signing.
- **Additional protection:** The configured package's public ABI arity is checked, untrusted BCS NFT/listing payloads are bounded, a changing wallet account invalidates an asynchronous owned-NFT query, and the expected digest and escrow metadata are verified before previewing. ABI checks alone **do not replace** source verification or an audit.
- **Separate deployment gate:** `npm run check:sui` and `.github/workflows/sui-readiness.yml` can check a published Testnet package without private keys. When no package ID is configured, the tool reports `UNPUBLISHED` without signing or enabling trading.
- **Walrus Testnet for creator blueprints:** **My Builds → More options → Walrus Testnet Share** can upload only a deliberately selected **public** safe blueprint (24 KB maximum) through the official Walrus Testnet publisher, generating a SHA-256 receipt. **Storage & Backup → Import Walrus Blueprint** can retrieve and verify public geometry. This feature is *not* NFT minting, is not a private backup, and relies on testnet services with limited availability and CORS compatibility. No live cross-browser upload has yet been verified.
- **Organizer fit:** CLAY Hackathon is hosted by Lofi the Yeti and describes Sui, Walrus and DeepBook as parts of the Sui Stack. The game integrates Sui/NFT source and optional Walrus storage; DeepBook liquidity/exchange trading is intentionally not needed for the mini-game.

See [CLAY Sui Stack readiness](CLAY_SUI_STACK_READINESS.md) for the official checklist and end-to-end acceptance plan.

The regular FlurryCraft browser game remains free and playable without a wallet.

### Reliability upgrade (18 November 2026)

- All Sui marketplace actions use a shared offline-tested success guard: a returned transaction must have an explicit successful execution status and usable digest. Failed Move transactions do not count as a sale or mint.
- Owned NFT and shared escrow contents are read as bounded BCS bytes (both immediate and asynchronous client-returned content). Invalid or oversized bytes are rejected before decoding.
- If transaction execution succeeded but the subsequent RPC index catches up slowly, the client does not incorrectly claim that the signed transaction was reverted or encourage a duplicate payment. Refresh holdings when indexing completes.
- These safeguards are covered by `tests/sui-response-guard.test.mjs`. They are source-level tests, **not** a real two-wallet Testnet demonstration.


## Wallet-authorized Testnet publication flow (source prepared, not executed)

**No wallet has signed or published the FlurryCraft package as of this guide update.** The project now includes a secure *self-custodial* browser flow so the person who owns the publishing wallet can authorize the required Testnet transaction without exposing their private key to GitHub or ChatGPT.

When GitHub Actions successfully compiles and tests the Move package, the Pages site includes an optional public `dist/flurrycraft-publish.json` containing compiled Move bytecode, dependency IDs, 32-byte package digest and exact Git commit SHA. This is public code, **not** a signed transaction, a package ID, or a wallet secret. If compilation fails, the publish bundle is withheld and the free game still deploys.

From a compatible Sui wallet browser:

1. Make sure your wallet is on **Sui Testnet** and has faucet-provided Testnet SUI to pay deployment gas. The official Testnet web faucet is https://faucet.sui.io/. Do **not** buy Mainnet SUI for this experiment.
2. **Developer only:** open the FlurryCraft site with `?developer=1` appended to the URL, enter a world, then open **Menu → Sui Testnet**. Normal players never need this setup. The URL flag only reveals developer controls; it is not authentication or authorization.
3. Expand **Developer · Publish Sui Testnet Contract** and press **Check compiled Testnet contract**. If the compiled bundle is missing, stop; the GitHub Actions Move compiler must pass first.
4. Open the **Check Testnet Wallet (read only)** wallet panel and connect the wallet you own. Connecting alone never signs.
5. Expand the developer section again, check the displayed source SHA and code size, and tap **Review and sign Testnet publication**.
6. Read the irreversible Testnet gas/public-code warning and explicitly approve. Then **approve the publish transaction in your wallet**. The wallet's UpgradeCap is transferred to **your own address**; no one should request your seed phrase.
7. If successful, save/copy the **transaction digest** and open it in Sui Explorer. Identify the new **published package ID**, also visible in the transaction's changed objects. Keep your UpgradeCap safe for future upgrades.
8. **Do not assume NFTs are enabled yet.** Before release, run `sui client verify-source` against the published bytecode and `npm run check:sui` with the verified address. A contract ABI check on its own is not proof of audited or expected code.
9. Once verification is complete, register that exact 0x + 64-hex Testnet ID in `js/sui-config.js` and redeploy. This **separately** unlocks mint/list/buy/cancel. Test using two different Testnet wallets before a public demo.

The publishing action must run under the wallet owner's direct control. ChatGPT and the GitHub repository **cannot sign on behalf of a wallet they do not have access to**. Do not upload or paste private keys, keystores or recovery phrases.

Normal gameplay and **Menu → Adventure → ✦ Rewards Hub** do not require users to publish a contract or obtain faucet coins. The local Flurry Points ledger is distinct from Sui cryptocurrency and is not withdrawable. See [Rewards Hub](REWARDS_HUB.md).

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
