// Multi-sender scenario tests run with: sui move test
#[test_only]
module flurrycraft::market_tests;

use flurrycraft::market::{Self, BuildNFT, Listing};
use sui::test_scenario as ts;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use std::hash;

const ALICE: address = @0xA;
const BOB: address = @0xB;

#[test]
fun mint_list_buy_transfers_escrowed_nft_and_exact_payment() {
    let mut s = ts::begin(ALICE);
    market::mint(b"Cozy Snow Cabin", vector[1, 2, 3, 4], s.ctx());
    s.next_tx(ALICE);
    {
        let nft = s.take_from_sender<BuildNFT>();
        assert!(market::creator(&nft) == ALICE, 101);
        assert!(*market::blueprint_digest(&nft) == hash::sha2_256(vector[1, 2, 3, 4]), 102);
        market::list(nft, 100, s.ctx());
    };
    s.next_tx(BOB);
    {
        let mut listing = s.take_shared<Listing>();
        assert!(market::listing_active(&listing), 103);
        assert!(market::listed_price(&listing) == 100, 104);
        let payment = coin::mint_for_testing<SUI>(100, s.ctx());
        market::buy(&mut listing, payment, s.ctx());
        assert!(!market::listing_active(&listing), 105);
        s.return_shared(listing);
    };
    s.next_tx(BOB);
    {
        let nft = s.take_from_sender<BuildNFT>();
        assert!(market::creator(&nft) == ALICE, 106);
        s.return_to_sender(nft);
    };
    s.next_tx(ALICE);
    {
        let payment = s.take_from_sender<Coin<SUI>>();
        assert!(coin::value(&payment) == 100, 107);
        s.return_to_sender(payment);
    };
    s.end();
}

#[test]
fun seller_can_cancel_and_get_the_same_nft_back() {
    let mut s = ts::begin(ALICE);
    market::mint(b"Treehouse", vector[9, 8, 7], s.ctx());
    s.next_tx(ALICE);
    {
        let nft = s.take_from_sender<BuildNFT>();
        market::list(nft, 77, s.ctx());
    };
    s.next_tx(ALICE);
    {
        let mut listing = s.take_shared<Listing>();
        assert!(market::listing_active(&listing), 201);
        market::cancel(&mut listing, s.ctx());
        assert!(!market::listing_active(&listing), 202);
        s.return_shared(listing);
    };
    s.next_tx(ALICE);
    {
        let nft = s.take_from_sender<BuildNFT>();
        assert!(market::creator(&nft) == ALICE, 203);
        s.return_to_sender(nft);
    };
    s.end();
}

#[test, expected_failure(abort_code = 4)]
fun only_seller_can_cancel() {
    let mut s = ts::begin(ALICE);
    market::mint(b"Village", vector[1], s.ctx());
    s.next_tx(ALICE);
    {
        let nft = s.take_from_sender<BuildNFT>();
        market::list(nft, 50, s.ctx());
    };
    s.next_tx(BOB);
    let mut listing = s.take_shared<Listing>();
    market::cancel(&mut listing, s.ctx());
    s.return_shared(listing);
    s.end();
}

#[test, expected_failure(abort_code = 6)]
fun wrong_payment_is_rejected() {
    let mut s = ts::begin(ALICE);
    market::mint(b"Castle", vector[1], s.ctx());
    s.next_tx(ALICE);
    {
        let nft = s.take_from_sender<BuildNFT>();
        market::list(nft, 100, s.ctx());
    };
    s.next_tx(BOB);
    let mut listing = s.take_shared<Listing>();
    let payment = coin::mint_for_testing<SUI>(99, s.ctx());
    market::buy(&mut listing, payment, s.ctx());
    s.return_shared(listing);
    s.end();
}

#[test, expected_failure(abort_code = 7)]
fun zero_price_listing_is_rejected() {
    let mut s = ts::begin(ALICE);
    market::mint(b"House", vector[1], s.ctx());
    s.next_tx(ALICE);
    let nft = s.take_from_sender<BuildNFT>();
    market::list(nft, 0, s.ctx());
    s.end();
}

#[test, expected_failure(abort_code = 3)]
fun empty_nft_name_is_rejected() {
    let mut s = ts::begin(ALICE);
    market::mint(vector[], vector[1], s.ctx());
    s.end();
}

#[test, expected_failure(abort_code = 1)]
fun empty_geometry_is_rejected() {
    let mut s = ts::begin(ALICE);
    market::mint(b"Empty", vector[], s.ctx());
    s.end();
}
