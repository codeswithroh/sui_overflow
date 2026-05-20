module aether::proof_registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use aether::vault::TradeProof;


    // --- Structures ---

    /// Shared registry holding a log of all verified trade execution proofs.
    /// This provides a decentralized public ledger for auditing AI decisions.
    public struct ProofRegistry has key, store {
        id: UID,
        proof_count: u64,
        proofs: Table<u64, TradeProofRecord>,
    }

    /// Optimized record structure stored inside the shared registry.
    public struct TradeProofRecord has store, copy, drop {
        vault_id: ID,
        timestamp_epoch: u64,
        amount: u64,
        walrus_blob_id: vector<u8>,
    }

    // --- Functions ---

    /// Initializes the public ledger as a shared object.
    /// In Sui, shared objects are accessible by anyone for reads and writes under contract conditions.
    public fun init_registry(ctx: &mut TxContext) {
        let registry = ProofRegistry {
            id: object::new(ctx),
            proof_count: 0,
            proofs: table::new<u64, TradeProofRecord>(ctx),
        };
        sui::transfer::share_object(registry);
    }

    /// Registers a newly minted TradeProof into the shared public ledger.
    public fun register_proof(
        registry: &mut ProofRegistry,
        proof: &TradeProof,
        _ctx: &mut TxContext
    ) {
        let count = registry.proof_count;
        
        // Extract fields to create record using getters
        let record = TradeProofRecord {
            vault_id: aether::vault::get_proof_vault_id(proof),
            timestamp_epoch: aether::vault::get_proof_timestamp(proof),
            amount: aether::vault::get_proof_amount(proof),
            walrus_blob_id: aether::vault::get_proof_blob_id(proof),
        };

        table::add(&mut registry.proofs, count, record);
        registry.proof_count = count + 1;
    }


    // --- Getter Functions ---

    public fun get_proof_count(registry: &ProofRegistry): u64 {
        registry.proof_count
    }
}
