module aether::vault {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;

    // --- Error Codes ---
    const ENotOwner: u64 = 0;
    const ENotAuthorizedAgent: u64 = 1;
    const EVaultPaused: u64 = 2;
    const EDailyLimitExceeded: u64 = 3;
    const EInsufficientFunds: u64 = 4;

    // --- Events ---
    public struct DepositEvent has copy, drop {
        vault_id: ID,
        owner: address,
        amount: u64,
    }

    public struct WithdrawEvent has copy, drop {
        vault_id: ID,
        owner: address,
        amount: u64,
    }

    public struct TradeExecutedEvent has copy, drop {
        vault_id: ID,
        agent: address,
        amount: u64,
        walrus_blob_id: vector<u8>,
    }

    public struct CircuitBreakerToggled has copy, drop {
        vault_id: ID,
        paused: bool,
    }

    // --- Core Vault Structures ---
    
    /// The primary smart vault resource which stores user assets.
    /// Manages access control and tracks risk/drawdown limits.
    public struct SmartVault<phantom T> has key, store {
        id: UID,
        owner: address,
        agent_address: address,
        pool: Balance<T>,
        daily_spent_limit: u64,
        daily_spent: u64,
        last_spend_epoch: u64,
        is_paused: bool,
    }

    /// On-chain proof linking a trade execution with its off-chain decision log on Walrus.
    public struct TradeProof has key, store {
        id: UID,
        vault_id: ID,
        timestamp_epoch: u64,
        amount: u64,
        walrus_blob_id: vector<u8>,
    }

    // --- Constructor & Initialization ---

    /// Creates a new SmartVault for a user, delegating trading permissions to an AI agent.
    public fun create_vault<T>(
        agent_address: address,
        daily_limit: u64,
        ctx: &mut TxContext
    ): SmartVault<T> {
        let owner = tx_context::sender(ctx);
        SmartVault {
            id: object::new(ctx),
            owner,
            agent_address,
            pool: balance::zero<T>(),
            daily_spent_limit: daily_limit,
            daily_spent: 0,
            last_spend_epoch: tx_context::epoch(ctx),
            is_paused: false,
        }
    }

    // --- User Actions (Deposit & Withdraw) ---

    /// Deposits coins into the vault. Anyone can deposit, but deposits trigger an event.
    public fun deposit<T>(
        vault: &mut SmartVault<T>,
        coin: Coin<T>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        let balance = coin::into_balance(coin);
        balance::join(&mut vault.pool, balance);

        event::emit(DepositEvent {
            vault_id: object::id(vault),
            owner: tx_context::sender(ctx),
            amount,
        });
    }

    /// Withdraws a specific amount of assets from the vault. Only the owner can withdraw.
    public fun withdraw<T>(
        vault: &mut SmartVault<T>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<T> {
        let sender = tx_context::sender(ctx);
        assert!(sender == vault.owner, ENotOwner);
        assert!(balance::value(&vault.pool) >= amount, EInsufficientFunds);

        let withdrawn_balance = balance::split(&mut vault.pool, amount);
        let coin = coin::from_balance(withdrawn_balance, ctx);

        event::emit(WithdrawEvent {
            vault_id: object::id(vault),
            owner: sender,
            amount,
        });

        coin
    }

    // --- AI Agent Authorized Actions ---

    /// Extracts assets from the vault to perform an authorized swap or trade.
    /// Enforces the agent whitelist, vault status, and daily spent limit.
    public fun extract_trade_funds<T>(
        vault: &mut SmartVault<T>,
        amount: u64,
        walrus_blob_id: vector<u8>,
        ctx: &mut TxContext
    ): (Coin<T>, TradeProof) {
        let sender = tx_context::sender(ctx);
        assert!(sender == vault.agent_address, ENotAuthorizedAgent);
        assert!(!vault.is_paused, EVaultPaused);
        assert!(balance::value(&vault.pool) >= amount, EInsufficientFunds);

        let current_epoch = tx_context::epoch(ctx);
        
        // Reset daily spend tracking if entering a new epoch
        if (current_epoch > vault.last_spend_epoch) {
            vault.daily_spent = 0;
            vault.last_spend_epoch = current_epoch;
        };

        // Enforce daily spend threshold limit
        assert!(vault.daily_spent + amount <= vault.daily_spent_limit, EDailyLimitExceeded);
        
        // Update daily spent state
        vault.daily_spent = vault.daily_spent + amount;

        // Split funds for the trade
        let trade_balance = balance::split(&mut vault.pool, amount);
        let coin = coin::from_balance(trade_balance, ctx);

        // Mint verifiable proof linked to the Walrus Blob ID
        let proof = TradeProof {
            id: object::new(ctx),
            vault_id: object::id(vault),
            timestamp_epoch: current_epoch,
            amount,
            walrus_blob_id,
        };

        event::emit(TradeExecutedEvent {
            vault_id: object::id(vault),
            agent: sender,
            amount,
            walrus_blob_id,
        });

        (coin, proof)
    }

    /// Returns traded coins back to the vault after the transaction is executed.
    public fun return_trade_funds<T>(
        vault: &mut SmartVault<T>,
        coin: Coin<T>,
        _ctx: &mut TxContext
    ) {
        let balance = coin::into_balance(coin);
        balance::join(&mut vault.pool, balance);
    }

    // --- Admin / Emergency Controls ---

    /// Updates the daily spending limits for the trading agent. Only the owner can modify.
    public fun set_limits<T>(
        vault: &mut SmartVault<T>,
        new_limit: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, ENotOwner);
        vault.daily_spent_limit = new_limit;
    }

    /// Emergency Circuit Breaker: Allows the owner to pause or resume trading operations instantly.
    public fun toggle_vault_pause<T>(
        vault: &mut SmartVault<T>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, ENotOwner);
        vault.is_paused = !vault.is_paused;

        event::emit(CircuitBreakerToggled {
            vault_id: object::id(vault),
            paused: vault.is_paused,
        });
    }

    // --- Getter Functions ---

    public fun get_owner<T>(vault: &SmartVault<T>): address {
        vault.owner
    }

    public fun get_agent<T>(vault: &SmartVault<T>): address {
        vault.agent_address
    }

    public fun get_balance<T>(vault: &SmartVault<T>): u64 {
        balance::value(&vault.pool)
    }

    public fun get_daily_limits<T>(vault: &SmartVault<T>): (u64, u64) {
        (vault.daily_spent_limit, vault.daily_spent)
    }

    public fun is_paused<T>(vault: &SmartVault<T>): bool {
        vault.is_paused
    }

    // --- TradeProof Getter Functions ---

    public fun get_proof_vault_id(proof: &TradeProof): ID {
        proof.vault_id
    }

    public fun get_proof_timestamp(proof: &TradeProof): u64 {
        proof.timestamp_epoch
    }

    public fun get_proof_amount(proof: &TradeProof): u64 {
        proof.amount
    }

    public fun get_proof_blob_id(proof: &TradeProof): vector<u8> {
        proof.walrus_blob_id
    }

    #[test_only]
    public fun destroy_proof_for_testing(proof: TradeProof) {
        let TradeProof { id, vault_id: _, timestamp_epoch: _, amount: _, walrus_blob_id: _ } = proof;
        object::delete(id);
    }
}


