#[test_only]
module aether::aether_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use aether::vault::{Self, SmartVault, TradeProof};

    // --- Admin & Test Addresses ---
    const OWNER_ADDR: address = @0xAA;
    const AGENT_ADDR: address = @0xBB;
    const ATTACKER_ADDR: address = @0xCC;

    // --- Helper Functions ---
    fun setup_vault(scenario: &mut Scenario): SmartVault<SUI> {
        test_scenario::next_tx(scenario, OWNER_ADDR);
        // Create vault with 1000 SUI daily spent limit
        vault::create_vault<SUI>(AGENT_ADDR, 1000, test_scenario::ctx(scenario))
    }

    // --- Test Suites ---

    #[test]
    fun test_deposit_withdraw_success() {
        let mut scenario = test_scenario::begin(OWNER_ADDR);
        let mut vault = setup_vault(&mut scenario);

        // 1. Owner deposits 500 SUI into the vault
        test_scenario::next_tx(&mut scenario, OWNER_ADDR);
        let deposit_coin = coin::mint_for_testing<SUI>(500, test_scenario::ctx(&mut scenario));
        vault::deposit(&mut vault, deposit_coin, test_scenario::ctx(&mut scenario));

        assert!(vault::get_balance(&vault) == 500, 0);

        // 2. Owner withdraws 200 SUI successfully
        test_scenario::next_tx(&mut scenario, OWNER_ADDR);
        let withdrawn_coin = vault::withdraw(&mut vault, 200, test_scenario::ctx(&mut scenario));
        assert!(coin::value(&withdrawn_coin) == 200, 1);
        assert!(vault::get_balance(&vault) == 300, 2);

        coin::burn_for_testing(withdrawn_coin);
        sui::transfer::public_transfer(vault, OWNER_ADDR);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = aether::vault::ENotOwner)]
    fun test_withdraw_unauthorized_attacker() {
        let mut scenario = test_scenario::begin(OWNER_ADDR);
        let mut vault = setup_vault(&mut scenario);

        // Attacker attempts to withdraw funds from the vault
        test_scenario::next_tx(&mut scenario, ATTACKER_ADDR);
        let withdrawn_coin = vault::withdraw(&mut vault, 100, test_scenario::ctx(&mut scenario));

        coin::burn_for_testing(withdrawn_coin);
        sui::transfer::public_transfer(vault, OWNER_ADDR);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_agent_trading_within_limits() {
        let mut scenario = test_scenario::begin(OWNER_ADDR);
        let mut vault = setup_vault(&mut scenario);

        // 1. Owner deposits 1000 SUI into vault
        test_scenario::next_tx(&mut scenario, OWNER_ADDR);
        let deposit_coin = coin::mint_for_testing<SUI>(1000, test_scenario::ctx(&mut scenario));
        vault::deposit(&mut vault, deposit_coin, test_scenario::ctx(&mut scenario));

        // 2. AI Agent extracts 400 SUI to execute a trade
        test_scenario::next_tx(&mut scenario, AGENT_ADDR);
        let walrus_blob_id = b"walrus_sentiment_blob_123";
        let (trade_funds, proof) = vault::extract_trade_funds(
            &mut vault,
            400,
            walrus_blob_id,
            test_scenario::ctx(&mut scenario)
        );

        // Verify funds and decision proof
        assert!(coin::value(&trade_funds) == 400, 3);
        assert!(vault::get_balance(&vault) == 600, 4);
        assert!(vault::get_proof_amount(&proof) == 400, 5);
        assert!(vault::get_proof_blob_id(&proof) == walrus_blob_id, 6);

        // 3. AI Agent returns the traded funds back to vault
        test_scenario::next_tx(&mut scenario, AGENT_ADDR);
        vault::return_trade_funds(&mut vault, trade_funds, test_scenario::ctx(&mut scenario));
        assert!(vault::get_balance(&vault) == 1000, 7);

        vault::destroy_proof_for_testing(proof);
        sui::transfer::public_transfer(vault, OWNER_ADDR);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = aether::vault::EDailyLimitExceeded)]
    fun test_agent_exceeds_daily_limit() {
        let mut scenario = test_scenario::begin(OWNER_ADDR);
        let mut vault = setup_vault(&mut scenario);

        // 1. Owner deposits 2000 SUI into vault
        test_scenario::next_tx(&mut scenario, OWNER_ADDR);
        let deposit_coin = coin::mint_for_testing<SUI>(2000, test_scenario::ctx(&mut scenario));
        vault::deposit(&mut vault, deposit_coin, test_scenario::ctx(&mut scenario));

        // 2. AI Agent extracts 1200 SUI (Daily limit is set to 1000 in setup_vault)
        test_scenario::next_tx(&mut scenario, AGENT_ADDR);
        let (trade_funds, proof) = vault::extract_trade_funds(
            &mut vault,
            1200,
            b"test_blob",
            test_scenario::ctx(&mut scenario)
        );

        coin::burn_for_testing(trade_funds);
        vault::destroy_proof_for_testing(proof);
        sui::transfer::public_transfer(vault, OWNER_ADDR);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = aether::vault::EVaultPaused)]
    fun test_circuit_breaker_emergency_pause() {
        let mut scenario = test_scenario::begin(OWNER_ADDR);
        let mut vault = setup_vault(&mut scenario);

        // 1. Owner deposits 1000 SUI
        test_scenario::next_tx(&mut scenario, OWNER_ADDR);
        let deposit_coin = coin::mint_for_testing<SUI>(1000, test_scenario::ctx(&mut scenario));
        vault::deposit(&mut vault, deposit_coin, test_scenario::ctx(&mut scenario));

        // 2. Owner toggles the circuit breaker pause switch
        test_scenario::next_tx(&mut scenario, OWNER_ADDR);
        vault::toggle_vault_pause(&mut vault, test_scenario::ctx(&mut scenario));
        assert!(vault::is_paused(&vault) == true, 8);

        // 3. AI Agent tries to trade while vault is paused (should fail immediately)
        test_scenario::next_tx(&mut scenario, AGENT_ADDR);
        let (trade_funds, proof) = vault::extract_trade_funds(
            &mut vault,
            200,
            b"test_blob",
            test_scenario::ctx(&mut scenario)
        );

        coin::burn_for_testing(trade_funds);
        vault::destroy_proof_for_testing(proof);
        sui::transfer::public_transfer(vault, OWNER_ADDR);
        test_scenario::end(scenario);
    }
}
