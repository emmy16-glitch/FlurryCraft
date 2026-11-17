/// FlurryCraft's experimental Sui Testnet NFT and escrow marketplace.
/// Onchain content is public; NFTs do not grant copyright or prevent copying.
/// This contract has not been independently audited. DO NOT publish to Mainnet.
module flurrycraft::market;

use std::hash;
use std::option::{Self, Option};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};

const EEmptyContent: u64 = 1;
const EContentTooLarge: u64 = 2;
const EEmptyName: u64 = 3;
const ENotSeller: u64 = 4;
const ENotForSale: u64 = 5;
const EWrongPayment: u64 = 6;
const EInvalidPrice: u64 = 7;
const MAX_CONTENT_BYTES: u64 = 24000;
const MAX_NAME_BYTES: u64 = 48;

/// A self-contained block blueprint. Geometry and its SHA-256 digest are
/// stored on Sui; a buyer can retrieve the exact playable design from their
/// owned object, without a separately hosted JSON file.
public struct BuildNFT has key, store {
    id: UID,
    name: vector<u8>,
    creator: address,
    digest: vector<u8>,
    geometry: vector<u8>,
}

/// Shared escrow. The object persists after sale/cancellation, but no longer
/// holds a blueprint. A seller cannot spend the escrowed NFT while listed.
public struct Listing has key {
    id: UID,
    seller: address,
    price: u64,
    name: vector<u8>,
    digest: vector<u8>,
    nft: Option<BuildNFT>,
}

public struct Minted has copy, drop {
    nft_id: ID,
    creator: address,
    digest: vector<u8>,
}
public struct Listed has copy, drop {
    listing_id: ID,
    seller: address,
    price: u64,
}
public struct Sale has copy, drop {
    listing_id: ID,
    buyer: address,
    seller: address,
    nft_id: ID,
    price: u64,
}
public struct Cancelled has copy, drop {
    listing_id: ID,
}

/// Anyone can mint with Testnet gas, but creator is the *minter's address*.
/// Offchain client validates the canonical FlurryCraft voxel format before
/// submitting bytes; the Move module enforces size and computes its own hash.
public fun mint(name: vector<u8>, geometry: vector<u8>, ctx: &mut TxContext) {
    assert!(name.length() > 0 && name.length() <= MAX_NAME_BYTES, EEmptyName);
    assert!(geometry.length() > 0, EEmptyContent);
    assert!(geometry.length() <= MAX_CONTENT_BYTES, EContentTooLarge);
    let digest = hash::sha2_256(copy geometry);
    let creator = ctx.sender();
    let nft = BuildNFT {
        id: object::new(ctx),
        name,
        creator,
        digest: copy digest,
        geometry,
    };
    event::emit(Minted { nft_id: object::id(&nft), creator, digest });
    transfer::public_transfer(nft, creator);
}

/// Transfers an existing NFT into a shared escrow object.
public fun list(nft: BuildNFT, price: u64, ctx: &mut TxContext) {
    assert!(price > 0, EInvalidPrice);
    let seller = ctx.sender();
    let listing = Listing {
        id: object::new(ctx),
        seller,
        price,
        name: copy nft.name,
        digest: copy nft.digest,
        nft: option::some(nft),
    };
    event::emit(Listed { listing_id: object::id(&listing), seller, price });
    transfer::share_object(listing);
}

/// Only the original listing seller can remove the NFT from an active listing.
public fun cancel(listing: &mut Listing, ctx: &mut TxContext) {
    assert!(ctx.sender() == listing.seller, ENotSeller);
    assert!(listing.nft.is_some(), ENotForSale);
    let nft = listing.nft.extract();
    event::emit(Cancelled { listing_id: object::id(listing) });
    transfer::public_transfer(nft, ctx.sender());
}

/// Exact payment in Testnet SUI (MIST). No royalties or platform fees.
/// Atomically transfers the escrowed NFT to buyer and Coin<SUI> to seller.
/// Client MUST refresh listing price and active state before requesting signature.
public fun buy(listing: &mut Listing, payment: Coin<SUI>, ctx: &mut TxContext) {
    assert!(listing.nft.is_some(), ENotForSale);
    assert!(coin::value(&payment) == listing.price, EWrongPayment);
    let buyer = ctx.sender();
    let nft = listing.nft.extract();
    event::emit(Sale {
        listing_id: object::id(listing),
        buyer,
        seller: listing.seller,
        nft_id: object::id(&nft),
        price: listing.price,
    });
    transfer::public_transfer(nft, buyer);
    transfer::public_transfer(payment, listing.seller);
}
